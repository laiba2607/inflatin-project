let chart;

async function getPrice() {
  const item = document.getElementById("item").value;

  if (!item) {
    alert("Enter item");
    return;
  }

  document.getElementById("result").innerHTML = "Loading...";

  try {
    const res = await fetch("/api/price", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ item })
    });

    // ✅ Agar backend error de raha ho to yahan pakar lo
    if (!res.ok) {
      throw new Error("Server error");
    }

    const data = await res.json();

    console.log("DATA:", data); // 👈 DEBUG

    // ✅ safe handling
    let trendClass = "stable";

    if (data.trend && data.trend.toLowerCase().includes("increasing")) {
      trendClass = "up";
    } else if (data.trend && data.trend.toLowerCase().includes("decreasing")) {
      trendClass = "down";
    }

    document.getElementById("result").innerHTML = `
      <div class="card">
        <h2>${data.item || "Item"}</h2>
        <p class="price">💰 ${data.estimated_price || "N/A"}</p>
        <p class="trend ${trendClass}">📈 ${data.trend || "Unknown"}</p>
        <p class="reason">🧠 ${data.reason || "-"}</p>
        <p class="tip">💡 ${data.budget_tip || "-"}</p>
      </div>
    `;

    if (data.weekly_data) {
      drawChart(data.weekly_data);
    }

  } catch (err) {
    console.log("FRONTEND ERROR:", err);

    document.getElementById("result").innerHTML = `
      <p style="color:red;">❌ Error fetching data</p>
    `;
  }
}

function drawChart(data) {
  const ctx = document.getElementById("chart");

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: data.map(d => d.day),
      datasets: [
        {
          label: "Price Trend",
          data: data.map(d => d.price),
          borderColor: "#22c55e",
          backgroundColor: "rgba(34,197,94,0.2)",
          fill: true
        }
      ]
    }
  });
}
document.getElementById("item").addEventListener("keypress", function (e) {
  if (e.key === "Enter") {
    getPrice();
  }
});