// eslint-disable-next-line @typescript-eslint/no-var-requires
const withNx = require('@nrwl/next/plugins/with-nx');

/**
 * @type {import('@nrwl/next/plugins/with-nx').WithNxOptions}
 * */
const nextConfig = {
  nx: {
    // Set this to false if you do not want to use SVGR
    // See: https://github.com/gregberge/svgr
    svgr: true,
  },
  images: {
    domains: [
      'project-lc-dev-test.s3.ap-northeast-2.amazonaws.com',
      'whiletrue.firstmall.kr',
    ],
  },
};

module.exports = withNx(nextConfig);
