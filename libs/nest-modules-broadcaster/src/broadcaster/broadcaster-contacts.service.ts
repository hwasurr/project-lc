import {
  CACHE_MANAGER,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { Broadcaster, BroadcasterContacts } from '@prisma/client';
import { ServiceBaseWithCache } from '@project-lc/nest-core';
import { PrismaService } from '@project-lc/prisma-orm';
import { BroadcasterContactDto, MAX_CONTACTS_COUNT } from '@project-lc/shared-types';
import { Cache } from 'cache-manager';

@Injectable()
export class BroadcasterContactsService extends ServiceBaseWithCache {
  #BROADCASTER_CONTACTS_CACHE_KEY = 'broadcaster/contacts';

  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) protected readonly cacheManager: Cache,
  ) {
    super(cacheManager);
  }

  /** 연락처 목록 조회 */
  public async findContacts(
    broadcasterId: BroadcasterContacts['broadcasterId'],
  ): Promise<BroadcasterContacts[]> {
    return this.prisma.broadcasterContacts.findMany({
      where: { broadcasterId },
      orderBy: [{ isDefault: 'desc' }, { createDate: 'desc' }],
    });
  }

  /** 연락처 생성 */
  public async createContact(
    broadcasterId: Broadcaster['id'],
    dto: BroadcasterContactDto,
  ): Promise<BroadcasterContacts | null> {
    const contacts = await this.prisma.broadcasterContacts.findMany({
      where: { broadcasterId },
    });
    // 최대개수 도달시 생성X
    if (contacts.length === MAX_CONTACTS_COUNT) return null;

    let readIsDefault: boolean = dto.isDefault;
    if (contacts.length === 0) {
      readIsDefault = true;
    }
    if (dto.isDefault) {
      const defaultContact = contacts.find((x) => x.isDefault);
      if (defaultContact) {
        await this.prisma.broadcasterContacts.update({
          where: { id: defaultContact.id },
          data: { isDefault: !defaultContact.isDefault },
        });
      }
    }

    await this._clearCaches(this.#BROADCASTER_CONTACTS_CACHE_KEY);
    return this.prisma.broadcasterContacts.create({
      data: {
        broadcasterId,
        email: dto.email,
        isDefault: readIsDefault,
        name: dto.name,
        phoneNumber: dto.phoneNumber,
      },
    });
  }

  /** 연락처 수정 */
  public async updateContact(
    contactId: BroadcasterContacts['id'],
    dto: BroadcasterContactDto,
  ): Promise<boolean> {
    const contact = await this.prisma.broadcasterContacts.findFirst({
      where: { id: contactId },
    });
    const contacts = await this.prisma.broadcasterContacts.findMany({
      where: { broadcasterId: contact.broadcasterId },
    });
    try {
      if (dto.isDefault) {
        const defaultContact = contacts.find((x) => x.isDefault);
        if (defaultContact) {
          await this.prisma.broadcasterContacts.update({
            where: { id: defaultContact.id },
            data: { isDefault: !defaultContact.isDefault },
          });
        }
      }
      await this.prisma.broadcasterContacts.update({
        where: { id: contactId },
        data: dto,
      });
      await this._clearCaches(this.#BROADCASTER_CONTACTS_CACHE_KEY);
      return true;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException();
    }
  }

  /** 연락처 삭제 */
  public async deleteContact(contactId: BroadcasterContacts['id']): Promise<boolean> {
    const deleteTarget = await this.prisma.broadcasterContacts.findFirst({
      where: { id: contactId },
    });
    await this._clearCaches(this.#BROADCASTER_CONTACTS_CACHE_KEY);
    if (deleteTarget.isDefault) return false;

    const result = await this.prisma.broadcasterContacts.delete({
      where: { id: contactId },
    });
    await this._clearCaches(this.#BROADCASTER_CONTACTS_CACHE_KEY);
    return !!result;
  }

  public async restoreBroadcasterContacts(
    broadcasterId: Broadcaster['id'],
  ): Promise<void> {
    const restoreDatas = await this.prisma.inactiveBroadcasterContacts.findMany({
      where: {
        broadcasterId,
      },
    });
    if (restoreDatas) {
      Promise.all(
        restoreDatas.map((restoreData) =>
          this.prisma.broadcasterContacts.create({
            data: restoreData || undefined,
          }),
        ),
      );
    }

    await this._clearCaches(this.#BROADCASTER_CONTACTS_CACHE_KEY);
  }
}
