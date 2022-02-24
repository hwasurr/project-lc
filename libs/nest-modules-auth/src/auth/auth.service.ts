import { Injectable, UnauthorizedException } from '@nestjs/common';
import {
  Administrator,
  Broadcaster,
  Seller,
  InactiveBroadcaster,
  InactiveSeller,
} from '@prisma/client';
import { JwtHelperService } from '@project-lc/nest-modules-jwt-helper';
import { UserPayload, authConstants } from '@project-lc/nest-core';
import { AdminAccountService } from '@project-lc/nest-modules-admin';
import { BroadcasterService } from '@project-lc/nest-modules-broadcaster';
import { SellerService } from '@project-lc/nest-modules-seller';
import { loginUserRes, UserProfileRes, UserType } from '@project-lc/shared-types';
import { Response } from 'express';

@Injectable()
export class AuthService {
  // private를 사용하는 이유는 해당 Service를 내부에서만 사용할 것이기 떄문이다.
  constructor(
    private readonly sellerService: SellerService,
    private readonly broadcasterService: BroadcasterService,
    private readonly adminAccountService: AdminAccountService,
    private jwtHelper: JwtHelperService,
  ) {}

  /**
   * 인증된 유저에 대해서 토큰을 발급합니다.
   * @param userPayload user(seller)의 데이터
   * @param stayLogedIn 로그인 유지 여부
   * @param userType    로그인의 user 타입
   * @returns {token data} 토큰 관련 정보
   */
  issueToken(
    userPayload: UserPayload,
    stayLogedIn: boolean,
    userType: UserType,
  ): loginUserRes {
    // token에 들어갈 데이터를 입력한다. -> 유저 타입 정도는 들어가는 것이 좋을 듯하다.
    return {
      token_type: 'bearer',
      access_token: this.jwtHelper.createAccessToken(
        userPayload,
        userType === 'admin'
          ? authConstants.ADMIN_ACCESS_TOKEN_EXPIRE_TIME_INT
          : undefined,
      ),
      expires_in:
        userType === 'admin'
          ? authConstants.ADMIN_ACCESS_TOKEN_EXPIRE_TIME_INT
          : authConstants.ACCESS_TOKEN_EXPIRE_TIME_INT,
      refresh_token: this.jwtHelper.createRefreshToken(userPayload, stayLogedIn),
      refresh_token_expires_in: stayLogedIn
        ? authConstants.COOKIE_AUTO_LOGIN_EXPIRE_TIME
        : authConstants.COOKIE_EXPIRE_TIME,
      scope: userType,
    };
  }

  /**
   * seller의 존재 여부를 확인한다. (local.strategy.ts 파일에서 사용)
   * @param email 입력한 이메일 문자열
   * @param pwdInput 입력한 패스워드 문자열
   * @returns {SellerPayload} User 인터페이스 객체
   */
  async validateUser(
    type: UserType,
    email: string,
    pwdInput: string,
  ): Promise<UserPayload | null> {
    let user: Seller | Broadcaster | Administrator | InactiveBroadcaster | InactiveSeller;
    if (['seller'].includes(type)) {
      user = await this.sellerService.login(email, pwdInput);
    }
    if (['admin'].includes(type)) {
      user = await this.adminAccountService.login(email, pwdInput);
    }
    if (['broadcaster'].includes(type)) {
      user = await this.broadcasterService.login(email, pwdInput);
    }

    return this.createUserPayload(user, type);
  }

  /**
   * 로그인시, 응답 객체에 새로운 Access Token을 헤더에 추가합니다.
   * @param res 요청 객체
   * @param userPayload Token에 저장될 payload
   */
  handleLogin(res: Response, loginToken: loginUserRes): void {
    res.append('Cache-Control', 'no-cache');
    this.jwtHelper.setAccessTokenHeader(res, loginToken.access_token);
    this.jwtHelper.setRefreshTokenCookie(
      res,
      loginToken.refresh_token,
      loginToken.refresh_token_expires_in,
    );
  }

  /**
   * 로그아웃시, 응답 객체의 쿠키 삭제, logout을 위한 토큰 전달
   * @param res 요청 객체
   */
  handleLogout(res: Response): void {
    this.jwtHelper.setRefreshTokenCookie(res, '', 0);
    this.jwtHelper.setAccessTokenHeader(res, 'logout');
  }

  /** 유저 JWT 토큰 내 생성 정보 */
  createUserPayload(
    user: Seller | Broadcaster | Administrator,
    type: UserType,
  ): UserPayload {
    return {
      id: user.id,
      sub: user.email,
      type,
      inactiveFlag: user.inactiveFlag,
    };
  }

  async getProfile(userPayload: UserPayload, appType: UserType): Promise<UserProfileRes> {
    const { sub, type } = userPayload;
    let user: Seller | Broadcaster | Administrator;
    // 판매자 정보 조회
    if (['seller'].includes(type)) {
      if (appType !== 'seller') {
        throw new UnauthorizedException();
      }
      user = await this.sellerService.findOne({ email: sub });
    }
    // 방송인 정보 조회
    if (['broadcaster'].includes(type)) {
      if (appType !== 'broadcaster') {
        throw new UnauthorizedException();
      }
      user = await this.broadcasterService.findOne({ email: sub });
    }
    // 관리자 정보 조회
    if (['admin'].includes(type)) {
      if (appType !== 'admin') {
        throw new UnauthorizedException();
      }
      user = await this.adminAccountService.findOne({ email: sub });
    }

    const hasPassword = Boolean(user.password);
    const { password, ..._user } = user;

    if ('userName' in _user) {
      return {
        ..._user,
        name: _user.userName,
        type,
        hasPassword,
      };
    }
    return {
      ..._user,
      type,
      hasPassword,
    };
  }
}
