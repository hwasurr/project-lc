import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bull';
import { Subject } from 'rxjs';
import { QueueKey } from './virtual-account.constant';

@Injectable()
export class ShutdownManager {
  private shutdownListeners: Subject<void> = new Subject();
  private readonly logContext = `😈 ${ShutdownManager.name}`;

  constructor(@InjectQueue(QueueKey) private readonly queue: Queue) {}

  /** 애플리케이션 종료 핸들러 */
  async shutdown(): Promise<void> {
    Logger.log(`Shutdown triggered.`, this.logContext);
    await this.queue.clean(process.uptime()).then((value) => {
      if (value.length > 0) Logger.log(`Queue cleaned.`, this.logContext);
    });
    return this.shutdownListeners.next();
  }

  /** 애플리케이션 종료 구독함수.
   * app.close()를 service단에서 사용할수 없어, 이에 대한 방안으로 rxjs 구독을 활용 */
  subscribeToShutdown(shutdownCallback: () => void): void {
    this.shutdownListeners.subscribe(() => shutdownCallback());
  }
}
