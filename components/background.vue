<template>
  <canvas ref="canvas" class="fixed top-0 left-0 w-full h-full z-[-1]"></canvas>
</template>

<script setup>
import { onMounted, ref, onBeforeUnmount } from 'vue'

const canvas = ref(null)
let animationFrameId
let stars = []

const initCanvas = () => {
  const ctx = canvas.value.getContext('2d')
  const width = window.innerWidth
  const height = window.innerHeight
  canvas.value.width = width
  canvas.value.height = height

  stars = Array.from({ length: 100 }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    size: Math.random() * 2 + 1,
    alpha: Math.random(),
    delta: Math.random() * 0.02 + 0.005
  }))

  const animate = () => {
    ctx.clearRect(0, 0, width, height)
    for (let star of stars) {
      star.alpha += star.delta
      if (star.alpha >= 1 || star.alpha <= 0) star.delta *= -1
      ctx.fillStyle = `rgba(255,255,255,${star.alpha})`
      ctx.fillRect(star.x, star.y, star.size, star.size)
    }
    animationFrameId = requestAnimationFrame(animate)
  }

  animate()
}

onMounted(() => {
  initCanvas()
  window.addEventListener('resize', initCanvas)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(animationFrameId)
  window.removeEventListener('resize', initCanvas)
})
</script>

<style scoped>
canvas {
  background: linear-gradient(to bottom, #0f0c29, #302b63, #24243e);
}
</style>
