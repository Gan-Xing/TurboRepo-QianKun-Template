import React from 'react';

const TaobaoLogin = () => {
  return (
    <div style={{ width: '300px', margin: '100px auto', textAlign: 'center' }}>
      <h2>淘宝登录</h2>
      <div>
        <input type="text" placeholder="用户名" style={{ margin: '10px 0', padding: '10px', width: '100%' }} />
      </div>
      <div>
        <input type="password" placeholder="密码" style={{ margin: '10px 0', padding: '10px', width: '100%' }} />
      </div>
      <button style={{ padding: '10px 20px', cursor: 'pointer' }}>登录</button>
    </div>
  );
};

export default TaobaoLogin;
