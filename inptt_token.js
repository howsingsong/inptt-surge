// InPTT Token Capture
// 自動擷取 Authorization Bearer Token 並儲存在 Surge 本機

const headers = $request.headers || {};

const auth =
  headers["authorization"] ||
  headers["Authorization"];

if (auth && auth.startsWith("Bearer ")) {
  const oldAuth = $persistentStore.read("inptt_authorization");

  if (auth !== oldAuth) {
    $persistentStore.write(auth, "inptt_authorization");
    console.log("InPTT Authorization Token 已更新");
  }
}

$done({});
