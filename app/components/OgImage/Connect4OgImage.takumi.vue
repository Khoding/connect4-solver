<script setup>
defineProps({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
});
</script>

<template>
  <div class="og-container">
    <div class="left-side">
      <div class="logo-area">
        <div class="logo-icon-container">
          <div class="logo-circle-red"></div>
          <div class="logo-circle-yellow"></div>
        </div>
        <span class="logo-text">Connect 4 Solver</span>
      </div>
      <h1 class="title">{{ title }}</h1>
      <p class="description">{{ description }}</p>
      <div class="badge-row">
        <span class="badge">WebAssembly</span>
        <span class="badge">Perfect Play</span>
        <span class="badge">Multilingual</span>
      </div>
    </div>
    <div class="right-side">
      <div class="board-frame">
        <div class="board-header">
          <div class="board-light-red"></div>
          <div class="board-light-yellow"></div>
          <div class="board-light-green"></div>
        </div>
        <div class="board">
          <!-- Col 1 -->
          <div class="column">
            <div class="slot-empty"></div>
            <div class="slot-empty"></div>
            <div class="slot-empty"></div>
            <div class="slot-empty"></div>
            <div class="slot-red"></div>
            <div class="slot-yellow"></div>
          </div>
          <!-- Col 2 -->
          <div class="column">
            <div class="slot-empty"></div>
            <div class="slot-empty"></div>
            <div class="slot-empty"></div>
            <div class="slot-empty"></div>
            <div class="slot-yellow"></div>
            <div class="slot-red"></div>
          </div>
          <!-- Col 3 -->
          <div class="column">
            <div class="slot-empty"></div>
            <div class="slot-empty"></div>
            <div class="slot-empty"></div>
            <div class="slot-yellow"></div>
            <div class="slot-red"></div>
            <div class="slot-yellow"></div>
          </div>
          <!-- Col 4 -->
          <div class="column">
            <div class="slot-empty"></div>
            <div class="slot-empty"></div>
            <div class="slot-red"></div>
            <div class="slot-yellow"></div>
            <div class="slot-red"></div>
            <div class="slot-red"></div>
          </div>
          <!-- Col 5 -->
          <div class="column">
            <div class="slot-empty"></div>
            <div class="slot-empty"></div>
            <div class="slot-empty"></div>
            <div class="slot-red"></div>
            <div class="slot-yellow"></div>
            <div class="slot-yellow"></div>
          </div>
          <!-- Col 6 -->
          <div class="column">
            <div class="slot-empty"></div>
            <div class="slot-empty"></div>
            <div class="slot-empty"></div>
            <div class="slot-empty"></div>
            <div class="slot-yellow"></div>
            <div class="slot-red"></div>
          </div>
          <!-- Col 7 -->
          <div class="column">
            <div class="slot-empty"></div>
            <div class="slot-empty"></div>
            <div class="slot-empty"></div>
            <div class="slot-empty"></div>
            <div class="slot-empty"></div>
            <div class="slot-yellow"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.og-container {
  width: 1200px;
  height: 630px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 80px;
  background: radial-gradient(circle at 30% 30%, #1e1e38 0%, #0c0c16 100%);
  color: #ffffff;
  font-family: 'Inter', sans-serif;
}

.left-side {
  display: flex;
  flex-direction: column;
  width: 550px;
  justify-content: center;
}

.logo-area {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-bottom: 24px;
}

.logo-icon-container {
  display: flex;
  flex-direction: row;
  margin-right: 12px;
}

.logo-circle-red {
  width: 16px;
  height: 16px;
  border-radius: 8px;
  margin-right: -4px;
  background-color: #ef4444;
}

.logo-circle-yellow {
  width: 16px;
  height: 16px;
  border-radius: 8px;
  background-color: #eab308;
}

.logo-text {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: #94a3b8;
  text-transform: uppercase;
}

.title {
  font-size: 52px;
  font-weight: 800;
  line-height: 1.15;
  margin-top: 0;
  margin-bottom: 20px;
  color: #f8fafc;
}

.description {
  font-size: 20px;
  line-height: 1.5;
  color: #cbd5e1;
  margin-bottom: 36px;
}

.badge-row {
  display: flex;
  flex-direction: row;
}

.badge {
  background-color: rgba(56, 189, 248, 0.15);
  border: 1px solid rgba(56, 189, 248, 0.3);
  color: #38bdf8;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  margin-right: 12px;
}

.right-side {
  display: flex;
  align-items: center;
  justify-content: center;
}

.board-frame {
  background-color: #1e1b4b;
  border: 6px solid #312e81;
  border-radius: 24px;
  padding: 24px;
  display: flex;
  flex-direction: column;
}

.board-header {
  display: flex;
  flex-direction: row;
  margin-bottom: 12px;
}

.board-light-red {
  width: 12px;
  height: 12px;
  border-radius: 6px;
  margin-right: 8px;
  background-color: #ef4444;
}

.board-light-yellow {
  width: 12px;
  height: 12px;
  border-radius: 6px;
  margin-right: 8px;
  background-color: #eab308;
}

.board-light-green {
  width: 12px;
  height: 12px;
  border-radius: 6px;
  background-color: #22c55e;
}

.board {
  display: flex;
  flex-direction: row;
}

.column {
  display: flex;
  flex-direction: column;
  margin-right: 12px;
}

.column:last-child {
  margin-right: 0;
}

.slot-empty {
  width: 44px;
  height: 44px;
  border-radius: 22px;
  margin-bottom: 12px;
  background-color: #0c0a09;
  border: 2px solid #292524;
}

.slot-red {
  width: 44px;
  height: 44px;
  border-radius: 22px;
  margin-bottom: 12px;
  background-color: #ef4444;
  border: 2px solid #b91c1c;
}

.slot-yellow {
  width: 44px;
  height: 44px;
  border-radius: 22px;
  margin-bottom: 12px;
  background-color: #eab308;
  border: 2px solid #a16207;
}

.column > div:last-child {
  margin-bottom: 0;
}
</style>
