// InPTT Auto Check-in

const auth = $persistentStore.read("inptt_authorization");

if (!auth) {
  $notification.post(
    "InPTT 自動簽到",
    "❌ 找不到登入 Token",
    "請先開啟一次 InPTT App"
  );

  $done();
} else {

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

  $httpClient.post(request, function(error, response, data) {

    if (error) {
      $notification.post(
        "InPTT 自動簽到",
        "❌ 連線失敗",
        String(error)
      );
      $done();
      return;
    }

    try {
      const result = JSON.parse(data);

      if (result.status === "success") {

        const d = result.data || {};

        $notification.post(
          "InPTT 自動簽到",
          "✅ 簽到成功",
          `獲得 ${d.awarded ?? "?"} 點｜總點數 ${d.total_points ?? "?"}｜連續 ${d.streak ?? "?"} 天｜週期第 ${d.day_in_cycle ?? "?"} 天`
        );

      } else {

        $notification.post(
          "InPTT 自動簽到",
          "⚠️ 簽到未成功",
          data || "沒有回傳資料"
        );
      }

    } catch (e) {

      $notification.post(
        "InPTT 自動簽到",
        "⚠️ 回傳內容無法解析",
        data || "沒有回傳內容"
      );
    }

    $done();
  });
}
