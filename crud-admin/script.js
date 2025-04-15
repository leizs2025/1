<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>打印报名资料</title>
  <style>
    body {
      font-family: 'Arial', sans-serif;
      padding: 30px;
      background-color: white;
      color: #000;
    }
    h1, h2 {
      text-align: center;
      color: #b30000;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .header img {
      width: 80px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 1rem;
    }
    th, td {
      border: 1px solid #444;
      padding: 6px;
      text-align: center;
      font-size: 14px;
    }
    .summary {
      margin-top: 30px;
      font-weight: bold;
      font-size: 16px;
    }
  </style>
</head>
<body>
  <div class="header">
    <img src="your-logo.png" alt="庙Logo" />
    <h1>庙宇名称</h1>
    <p>地址：XX市XX路XX号</p>
    <h2>太岁光明灯报名资料</h2>
    <p>（乙巳年）2025｜太岁：吴遂太岁</p>
  </div>

  <div id="content"></div>

  <script>
    window.addEventListener("message", event => {
      const data = JSON.parse(event.data);
      const div = document.getElementById("content");

      div.innerHTML = `
        <p><strong>主祈者：</strong> ${data.mainName}｜<strong>电话：</strong> ${data.phoneNumber}</p>
        <table>
          <tr>
            <th>姓名</th><th>生肖</th><th>太岁</th><th>光明灯</th><th>长生禄位</th><th>文昌帝君</th><th>十六罗汉</th><th>功德金</th>
          </tr>
          ${data.data.map(p => p.name || p.zodiac ? `
            <tr>
              <td>${p.name || ""}</td>
              <td>${p.zodiac || ""}</td>
              <td>${p.taiSui || ""}</td>
              <td>${p.light || ""}</td>
              <td>${p.longevity || ""}</td>
              <td>${p.wisdom || ""}</td>
              <td>${p.arhat || ""}</td>
              <td>${p.donation || 0}</td>
            </tr>` : '').join('')}
        </table>
        <div class="summary">
          安奉功德金合计：${data.data.reduce((s, d) => s + (Number(d.donation) || 0), 0)}<br/>
          真佛十四宝金 3.00 x ${data.data.reduce((sum, p) => (
            (p.paperGold1 + p.paperGold2 + p.paperGold3 + p.paperGold4 + p.paperGold5) ? sum + 1 : sum
          ), 0)} 份 = ${data.data.reduce((sum, p) => (
            (p.paperGold1 + p.paperGold2 + p.paperGold3 + p.paperGold4 + p.paperGold5) * 3
          ), 0)}<br/>
          赞助总金额： ${data.data.reduce((sum, p) =>
            (p.paperGold1 + p.paperGold2 + p.paperGold3 + p.paperGold4 + p.paperGold5) * 3 + (p.donation || 0), 0)
          }
        </div>
        <p style="margin-top:40px; text-align:center;">
          师尊、佛菩萨加持灾厄化解，逢凶化吉，万事都如意。
        </p>
      `;
    });
  </script>
</body>
</html>
