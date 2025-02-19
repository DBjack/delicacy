"use strict";

const db = uniCloud.database();
const dbCmd = db.command;
const appId = 'wx58337efb4c35fab6'; // 从manifest.json中获取
const appSecret = '55535e53b3e9d384301a806a81697d8b'; // 从环境变量获取

exports.main = async (event, context) => {
  const { action, data, params = {} } = event;

  switch (action) {
    case "getOpenId":
      return await getOpenId(data);
    case "uploadFile":
      return await uploadFile(data);
    case 'code2Session':
      return await code2Session(params);
    default:
      return {
        code: 404,
        msg: "未找到对应的方法",
      };
  }
};

// 获取openid
async function getOpenId(data) {
  const { code } = data;

  try {
    const res = await uniCloud.getPhoneNumber({
      code,
      provider: "weixin",
    });

    return {
      code: 0,
      msg: "获取成功",
      data: res,
    };
  } catch (e) {
    return {
      code: -1,
      msg: "获取失败",
      error: e,
    };
  }
}

// 上传文件
async function uploadFile(data) {
  const { cloudPath, fileContent } = data;

  try {
    const result = await uniCloud.uploadFile({
      cloudPath,
      fileContent,
    });

    return {
      code: 0,
      msg: "上传成功",
      data: {
        fileID: result.fileID,
        fileUrl: result.fileID,
      },
    };
  } catch (e) {
    return {
      code: -1,
      msg: "上传失败",
      error: e,
    };
  }
}

// 微信登录凭证校验
async function code2Session(params) {
  try {
    const { code } = params;
    
    if (!code) {
      return {
        code: 400,
        msg: '参数不完整'
      };
    }

    if (!appSecret) {
      return {
        code: 500,
        msg: '未配置appSecret，请在云函数配置中添加环境变量WX_APP_SECRET'
      };
    }
    
    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${appSecret}&js_code=${code}&grant_type=authorization_code`;
    
    console.log('请求微信接口:', url);
    
    const res = await uniCloud.httpclient.request(url, {
      method: 'GET',
      dataType: 'json'
    });
    
    console.log('微信接口返回:', res);
    
    if (res.status === 200) {
      const { openid, session_key, unionid, errcode, errmsg } = res.data;
      
      if (errcode) {
        throw new Error(errmsg);
      }
      
      return {
        code: 0,
        msg: 'success',
        data: {
          openid,
          sessionKey: session_key,
          unionid
        }
      };
    } else {
      throw new Error('请求失败');
    }
  } catch (e) {
    console.error('code2Session错误:', e);
    return {
      code: 500,
      msg: e.message
    };
  }
}
