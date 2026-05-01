const ci = require('miniprogram-ci');
const path = require('path');

const project = new ci.Project({
  appid: 'wx4afb3e5f7d1f4bab',
  type: 'miniProgram',
  projectPath: path.join(__dirname, '../client'),
  privateKeyPath: path.join(__dirname, '../cert/private.key'),
  ignores: ['node_modules/**/*'],
});

async function upload() {
  try {
    const result = await ci.upload({
      project,
      version: '1.0.0',
      desc: '初版发布：邀约交友小程序',
      setting: {
        es6: true,
        es7: true,
        minify: true,
        autoPrefixWXSS: true,
      },
      onProgressUpdate: (info) => {
        console.log('进度:', info);
      },
    });
    console.log('上传成功 🎉', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('上传失败:', err);
  }
}

upload();
