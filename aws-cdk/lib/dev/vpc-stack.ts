/* eslint-disable @typescript-eslint/explicit-function-return-type */
import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import { constants } from '../../constants';

// CONSTANTS
const ID_PREFIX = 'LC-DEV-';
// const DATABASE_PORT = 3306;

export class LCDevVpcStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public albSecGrp: ec2.SecurityGroup;
  public dbSecGrp: ec2.SecurityGroup;
  public apiSecGrp: ec2.SecurityGroup;
  public overlaySecGrp: ec2.SecurityGroup;
  public overlayControllerSecGrp: ec2.SecurityGroup;

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // *********************************************
    // ************** VPC and Subnets **************
    // *********************************************
    // * vpc
    this.vpc = new ec2.Vpc(this, `${ID_PREFIX}Vpc`, {
      cidr: '10.0.0.0/16',
      natGateways: 1,
      maxAzs: 2,
      subnetConfiguration: [
        {
          subnetType: ec2.SubnetType.PUBLIC,
          name: constants.DEV.INGRESS_SUBNET_GROUP_NAME,
        },
        {
          subnetType: ec2.SubnetType.PRIVATE,
          name: constants.DEV.PRIVATE_SUBNET_GROUP_NAME,
        },
      ],
    });

    this.createAlbSecGrp();
    const apiSecGrp = this.createApiSecGrp();
    const overlaySecGrp = this.createOverlaySecGrp();
    const overlayControllerSecGrp = this.createOverlayControllerSecGrp();
    this.createDbSecGrp({ apiSecGrp, overlaySecGrp, overlayControllerSecGrp });
  }

  /** 로드밸런서(ALB) 보안 그룹 생성 */
  private createAlbSecGrp() {
    this.albSecGrp = new ec2.SecurityGroup(this, `${ID_PREFIX}ALB-SecGrp`, {
      vpc: this.vpc,
      description: 'ALB security group for project-lc',
      allowAllOutbound: true,
    });

    this.albSecGrp.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow 80 to all',
    );
    this.albSecGrp.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow 443 to all',
    );

    return this.albSecGrp;
  }

  /** 데이터베이스 보안 그룹 생성 */
  private createDbSecGrp({
    apiSecGrp,
    overlaySecGrp,
    overlayControllerSecGrp,
  }: Record<
    'apiSecGrp' | 'overlaySecGrp' | 'overlayControllerSecGrp',
    ec2.SecurityGroup
  >) {
    // * 보안그룹
    // db 보안그룹
    this.dbSecGrp = new ec2.SecurityGroup(this, `${ID_PREFIX}DB-SecGrp`, {
      vpc: this.vpc,
      description: 'database security grp for project-lc',
      allowAllOutbound: false,
    });
    // * 보안그룹 룰 지정
    this.dbSecGrp.addIngressRule(
      ec2.Peer.ipv4(constants.WHILETRUE_IP_ADDRESS),
      ec2.Port.tcp(3306),
      'Allow port 3306 for outbound traffics to the whiletrue developers',
    );
    this.dbSecGrp.addIngressRule(
      apiSecGrp ?? this.apiSecGrp,
      ec2.Port.tcp(3306),
      'Allow port 3306 only to traffic from api security group',
    );
    this.dbSecGrp.addIngressRule(
      overlaySecGrp ?? this.overlaySecGrp,
      ec2.Port.tcp(3306),
      'Allow port 3306 only to traffic from overlay security group',
    );
    this.dbSecGrp.addIngressRule(
      overlayControllerSecGrp ?? this.overlayControllerSecGrp,
      ec2.Port.tcp(3306),
      'Allow port 3306 only to traffic from overlay-controller security group',
    );

    this.dbSecGrp.addIngressRule(
      new ec2.SecurityGroup(this, `${ID_PREFIX}BuilderSecGrp`, {
        vpc: this.vpc,
        description: 'github actions builder security group',
        allowAllOutbound: true,
      }),
      ec2.Port.tcp(3306),
      'Allow github actions builder',
    );

    return this.dbSecGrp;
  }

  /** API 서버 보안 그룹 생성 */
  private createApiSecGrp() {
    this.apiSecGrp = new ec2.SecurityGroup(this, `${ID_PREFIX}API-SecGrp`, {
      vpc: this.vpc,
      description: 'api security grp for project-lc',
      allowAllOutbound: true,
    });

    this.apiSecGrp.addIngressRule(
      this.albSecGrp,
      ec2.Port.tcp(3000),
      'allow port 3000 to anywhere',
    );

    return this.apiSecGrp;
  }

  /** 오버레이 서버 보안 그룹 생성 */
  private createOverlaySecGrp() {
    this.overlaySecGrp = new ec2.SecurityGroup(this, `${ID_PREFIX}Overlay-SecGrp`, {
      vpc: this.vpc,
      description: 'overlay security grp for project-lc',
      allowAllOutbound: true,
    });

    this.overlaySecGrp.addIngressRule(
      this.albSecGrp,
      ec2.Port.tcp(3002),
      'allow port 3002 to anywhere',
    );

    return this.overlaySecGrp;
  }

  /** 오버레이 컨트롤러 서버 보안 그룹 생성 */
  private createOverlayControllerSecGrp() {
    this.overlayControllerSecGrp = new ec2.SecurityGroup(
      this,
      `${ID_PREFIX}OverlayController-SecGrp`,
      {
        vpc: this.vpc,
        description: 'overlay-controller security grp for project-lc',
        allowAllOutbound: true,
      },
    );

    this.overlayControllerSecGrp.addIngressRule(
      this.albSecGrp,
      ec2.Port.tcp(3333),
      'allow port 3333 to alb',
    );

    return this.overlayControllerSecGrp;
  }
}
