// InPTT Token Capture
// 自動擷取 Authorization Bearer Token

const headers = $request.headers || {};

const auth =
  headers["authorization"] ||
  headers["Authorization"];

if (auth && /^Bearer\s+/i.test(auth)) {

  const oldAuth = $persistentStore.read("inptt_authorization");

  if (auth !== oldAuth) {

    const success = $persistentStore.write(
      auth,
      "inptt_authorization"
    );

    if (success) {
      console.log("✅ InPTT Token 已更新並儲存");
    } else {
      console.log("❌ InPTT Token 儲存失敗");
    }

  } else {
    console.log("ℹ️ InPTT Token 無變化");
  }
}

$done({});
