// ==========================================
// InPTT Token Capture for Surge
// Author: howsingsong
// ==========================================

const STORE_KEY = "inptt_authorization";

try {
  const headers = $request.headers || {};

  const authorization =
    headers["authorization"] ||
    headers["Authorization"];

  if (!authorization) {
    console.log("ℹ️ InPTT：此請求沒有 Authorization Header");
    $done({});
  } else if (!/^Bearer\s+/i.test(authorization)) {
    console.log("ℹ️ InPTT：Authorization 不是 Bearer Token");
    $done({});
  } else {

    const oldAuthorization =
      $persistentStore.read(STORE_KEY);

    // Token 沒有變化
    if (oldAuthorization === authorization) {

      console.log("ℹ️ InPTT Token 無變化");

      $done({});

    } else {

      const success =
        $persistentStore.write(
          authorization,
          STORE_KEY
        );

      if (success) {
        console.log("✅ InPTT Token 已擷取並儲存");
      } else {
        console.log("❌ InPTT Token 儲存失敗");
      }

      $done({});
    }
  }

} catch (error) {

  console.log(
    "❌ InPTT Token 擷取錯誤：" +
    String(error)
  );

  $done({});
}
