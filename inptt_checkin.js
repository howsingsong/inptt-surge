// ==========================================
// InPTT Auto Check-in for Surge
// Author: howsingsong
// ==========================================

const STORE_KEY = "inptt_authorization";


// ==========================================
// 解析 Surge Module Arguments
// ==========================================

function parseArguments(argumentString) {

  const result = {};

  if (!argumentString) {
    return result;
  }

  argumentString
    .split("&")
    .forEach(item => {

      const index =
        item.indexOf("=");

      if (index === -1) {
        return;
      }

      const key =
        item.substring(
          0,
          index
        );

      const value =
        item.substring(
          index + 1
        );

      result[key] =
        value;
    });

  return result;
}


// ==========================================
// 讀取 Module Arguments
// ==========================================

const args =
  parseArguments(
    typeof $argument !== "undefined"
      ? $argument
      : ""
  );


// ==========================================
// 通知設定
// ==========================================

const notifyEnabled =
  String(
    args.notify || "true"
  ).toLowerCase() !== "false";


// ==========================================
// Token 設定
// ==========================================

let manualToken =
  String(
    args.manual_token || "auto"
  ).trim();

let authorization;


// ==========================================
// 自動 Token 模式
// ==========================================

if (
  manualToken === "" ||
  manualToken.toLowerCase() === "auto"
) {

  authorization =
    $persistentStore.read(
      STORE_KEY
    );

  if (authorization) {

    console.log(
      "ℹ️ InPTT：使用自動擷取的 Token"
    );

  } else {

    console.log(
      "❌ InPTT：尚未擷取 Token"
    );
  }


// ==========================================
// 手動 Token 模式
// ==========================================

} else {

  if (
    /^Bearer\s+/i.test(
      manualToken
    )
  ) {

    authorization =
      manualToken;

  } else {

    authorization =
      "Bearer " +
      manualToken;
  }

  console.log(
    "ℹ️ InPTT：使用模組手動設定的 Token"
  );
}


// ==========================================
// 沒有 Token
// ==========================================

if (!authorization) {

  const message =
    "請先開啟 InPTT App，讓 Surge 自動擷取登入 Token。";

  console.log(
    "❌ " +
    message
  );

  if (notifyEnabled) {

    $notification.post(
      "InPTT 自動簽到",
      "❌ 找不到登入 Token",
      message
    );
  }

  $done();

} else {

  performCheckin();
}


// ==========================================
// 執行 InPTT 簽到
// ==========================================

function performCheckin() {

  const request = {

    url:
      "https://api.inptt.cc/checkin/action",

    headers: {

      "Authorization":
        authorization,

      "inptt":
        "ios",

      "Accept":
        "*/*",

      "Accept-Language":
        "zh-TW,zh-Hant;q=0.9",

      "User-Agent":
        "Mozilla/5.0 (iPhone; CPU iPhone OS 26_6_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) InPTT/1.4.6",

      "Referer":
        "https://api.inptt.cc"
    }
  };


  // ========================================
  // POST /checkin/action
  // ========================================

  $httpClient.post(
    request,
    function(
      error,
      response,
      data
    ) {

      // ====================================
      // 網路錯誤
      // ====================================

      if (error) {

        const message =
          String(error);

        console.log(
          "❌ InPTT 簽到連線失敗：" +
          message
        );

        if (notifyEnabled) {

          $notification.post(
            "InPTT 自動簽到",
            "❌ 連線失敗",
            message
          );
        }

        $done();

        return;
      }


      // ====================================
      // HTTP Status Code
      // ====================================

      const statusCode =
        Number(
          response &&
          (
            response.status ||
            response.statusCode
          )
        ) || 0;


      console.log(
        "ℹ️ InPTT HTTP Status：" +
        statusCode
      );


      // ====================================
      // Token 失效
      // ====================================

      if (
        statusCode === 401 ||
        statusCode === 403
      ) {

        console.log(
          "⚠️ InPTT Token 已失效或沒有權限"
        );

        if (notifyEnabled) {

          $notification.post(
            "InPTT 自動簽到",
            "⚠️ Token 已失效",
            "請重新開啟 InPTT App，Surge 會自動擷取新的 Token。"
          );
        }

        $done();

        return;
      }


      // ====================================
      // 解析 JSON
      // ====================================

      let result;

      try {

        result =
          JSON.parse(
            data || "{}"
          );

      } catch (error) {

        console.log(
          "⚠️ InPTT 回傳內容不是有效 JSON"
        );

        console.log(
          data || ""
        );

        if (notifyEnabled) {

          $notification.post(
            "InPTT 自動簽到",
            "⚠️ 回傳資料異常",
            data ||
            "伺服器沒有回傳內容"
          );
        }

        $done();

        return;
      }


      // ====================================
      // 簽到成功
      // ====================================

      if (
        result.status ===
        "success"
      ) {

        const d =
          result.data || {};


        const awarded =
          d.awarded !== undefined
            ? d.awarded
            : "?";


        const totalPoints =
          d.total_points !== undefined
            ? d.total_points
            : "?";


        const streak =
          d.streak !== undefined
            ? d.streak
            : "?";


        const dayInCycle =
          d.day_in_cycle !== undefined
            ? d.day_in_cycle
            : "?";


        const message =
          "獲得 " +
          awarded +
          " 點" +
          "｜總點數 " +
          totalPoints +
          "｜連續 " +
          streak +
          " 天" +
          "｜週期第 " +
          dayInCycle +
          " 天";


        console.log(
          "✅ InPTT 簽到成功"
        );

        console.log(
          message
        );


        if (notifyEnabled) {

          $notification.post(
            "InPTT 自動簽到",
            awarded > 0
              ? "✅ 簽到成功"
              : "✅ 今日已完成",
            message
          );
        }

        $done();

        return;
      }


      // ====================================
      // API 回傳其他狀態
      // ====================================

      const errorMessage =
        result.message ||
        result.error ||
        data ||
        "未知錯誤";


      console.log(
        "⚠️ InPTT 簽到未成功：" +
        errorMessage
      );


      if (notifyEnabled) {

        $notification.post(
          "InPTT 自動簽到",
          "⚠️ 簽到未成功",
          String(
            errorMessage
          )
        );
      }


      $done();
    }
  );
}
