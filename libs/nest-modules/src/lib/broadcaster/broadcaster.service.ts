import { Injectable } from '@nestjs/common';
import { PrismaService } from '@project-lc/prisma-orm';
import { throwError } from 'rxjs';
import { hash } from 'argon2';
import { BroadcasterDTO, SignUpDto } from '@project-lc/shared-types';
import { Broadcaster } from '@prisma/client';
@Injectable()
export class BroadcasterService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserId(overlayUrl: string): Promise<{ userId: string }> {
    const userId = await this.prisma.broadcaster.findUnique({
      select: {
        userId: true,
      },
      where: {
        overlayUrl,
      },
    });
    if (!userId) {
      throwError('Fail to get userId by overlayUrl');
    }
    return userId;
  }

  async getAllBroadcasterIdAndNickname(): Promise<BroadcasterDTO[]> {
    return this.prisma.broadcaster.findMany({
      where: {
        deleteFlag: false,
      },
      select: {
        userId: true,
        userNickname: true,
        afreecaId: true,
        twitchId: true,
        youtubeId: true,
        channelUrl: true,
      },
    });
  }

  /** 방송인 회원가입 서비스 핸들러 */
  async signUp(dto: SignUpDto): Promise<Broadcaster> {
    const hashedPw = await hash(dto.password);
    const broadcaster = await this.prisma.broadcaster.create({
      data: {
        email: dto.email,
        userName: dto.name,
        password: hashedPw,
        userId: dto.email,
        userNickname: '',
        overlayUrl: `/${dto.email}`,
      },
    });
    return broadcaster;
  }

  /**
   * 방송인 테이블에서 이메일 주소가 중복되는 지 체크합니다.
   * @param email 중복체크할 이메일 주소
   * @returns {boolean} 중복되지않아 괜찮은 경우 true, 중복된 경우 false
   */
  async isEmailDupCheckOk(email: string): Promise<boolean> {
    const user = await this.prisma.broadcaster.findFirst({ where: { email } });
    if (user) return false;
    return true;
  }
}
