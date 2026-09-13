// InPTT Auto Check-in
// 支援 Surge Module 參數

function parseArguments(str) {
  const result = {};

  if (!str) return result;

  str.split("&").forEach(item => {
    const index = item.indexOf("=");

    if (index !== -1) {
      const key = item.substring(0, index);
      const value = item.substring(index + 1);
      result[key] = value;
    }
  });

  return result;
}

const args = parseArguments(
  typeof $argument !== "undefined" ? $argument : ""
);

const notifyEnabled =
  String(args.notify || "true").toLowerCase() !== "false";

let manualToken = (args.manual_token || "").trim();


// ==============================
// Token 取得
// ==============================

let auth;

if (manualToken) {

  // 可直接貼 JWT，也可以貼 Bearer xxxxx
  if (/^Bearer\s+/i.test(manualToken)) {
    auth = manualToken;
  } else {
    auth = "Bearer " + manualToken;
  }

  console.log("ℹ️ 使用模組中手動設定的 Token");

} else {

  auth = $persistentStore.read("inptt_authorization");

  if (auth) {
    console.log("ℹ️ 使用 Surge 自動擷取的 Token");
  }
}


// ==============================
// 沒有 Token
// ==============================

if (!auth) {

  const message =
    "請先開啟一次 InPTT App，讓 Surge 自動取得 Token，或在模組參數 manual_token 中手動填入。";

  console.log("❌ " + message);

  if (notifyEnabled) {
    $notification.post(
      "InPTT 自動簽到",
      "❌ 找不到登入 Token",
      message
    );
  }

  $done();

} else {

  checkin();
}


// ==============================
// 執行簽到
// ==============================

function checkin() {

  const request = {
    url: "https://api.inptt.cc/checkin/action",

    headers: {
      "Authorization": auth,
      "inptt": "ios",
      "Accept": "*/*",
      "Accept-Language": "zh-TW,zh-Hant;q=0.9",
      "User-Agent":
        "Mozilla/5.0 (iPhone; CPU iPhone OS 26_6_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) InPTT/1.4.6",
      "Referer": "https://api.inptt.cc"
    }
  };


  $httpClient.post(
    request,
    function(error, response, data) {

      if (error) {

        console.log(
          "❌ InPTT 簽到連線失敗：" + error
        );

        if (notifyEnabled) {
          $notification.post(
            "InPTT 自動簽到",
            "❌ 連線失敗",
            String(error)
          );
        }

        $done();
        return;
      }


      const statusCode =
        Number(
          response &&
          (
            response.status ||
            response.statusCode
          )
        ) || 0;


      // ==============================
      // Token 失效
      // ==============================

      if (
        statusCode === 401 ||
        statusCode === 403
      ) {

        console.log(
          "⚠️ InPTT Token 可能已失效"
        );

        if (notifyEnabled) {
          $notification.post(
            "InPTT 自動簽到",
            "⚠️ Token 已失效",
            "請重新開啟 InPTT App，Surge 會自動取得新的 Token。"
          );
        }

        $done();
        return;
      }


      // ==============================
      // JSON 解析
      // ==============================

      let result;

      try {

        result = JSON.parse(data);

      } catch (e) {

        console.log(
          "⚠️ 無法解析 InPTT 回傳內容：" +
          data
        );

        if (notifyEnabled) {
          $notification.post(
            "InPTT 自動簽到",
            "⚠️ 回傳內容異常",
            data || "沒有回傳內容"
          );
        }

        $done();
        return;
      }


      // ==============================
      // 成功
      // ==============================

      if (result.status === "success") {

        const d = result.data || {};

        const awarded =
          d.awarded ?? "?";

        const total =
          d.total_points ?? "?";

        const streak =
          d.streak ?? "?";

        const day =
          d.day_in_cycle ?? "?";


        const message =
          `獲得 ${awarded} 點｜` +
          `總點數 ${total}｜` +
          `連續 ${streak} 天｜` +
          `週期第 ${day} 天`;


        console.log(
          "✅ InPTT 簽到成功：" +
          message
        );


        if (notifyEnabled) {

          $notification.post(
            "InPTT 自動簽到",
            "✅ 簽到成功",
            message
          );
        }

      } else {

        console.log(
          "⚠️ InPTT 簽到未成功：" +
          data
        );

        if (notifyEnabled) {

          $notification.post(
            "InPTT 自動簽到",
            "⚠️ 簽到未成功",
            data
          );
        }
      }

      $done();
    }
  );
}
