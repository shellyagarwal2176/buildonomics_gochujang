import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const HAND = `<path d="M120 18 C130 34 148 104 157 156 C163 190 152 220 147 240 C151 262 156 282 160 300 L120 300 Z" fill="#E6A383"/>
<path d="M141 90 C150 120 156 140 157 156 C163 190 152 220 147 240 C151 262 156 282 160 300 L150 300 C146 280 141 260 139 242 C144 220 150 192 146 162 C145 140 143 116 141 90 Z" fill="#D08665"/>
<path d="M120 196 C121 168 126 146 133 138 C143 150 146 176 140 196 C136 208 128 213 120 213 Z" fill="#F0B899"/>
<path d="M127 60 C132 76 136 96 139 116" fill="none" stroke="#B86A4E" stroke-width="1.6" stroke-linecap="round" opacity=".55"/>
<path d="M120 252 C132 250 146 252 152 256 L153 264 C146 260 132 258 120 260 Z" fill="#E0567D"/>
<path d="M120 266 C132 264 148 266 155 270 L156 277 C148 273 132 271 120 273 Z" fill="#F7A072"/>
<path d="M120 280 C133 278 150 280 157 284 L158 290 C150 286 133 284 120 286 Z" fill="#E0567D"/>`

// Ported from the original static prototype. Behavior is unchanged — same
// animation timing, same math — only rewritten to mount/teardown cleanly as
// a React component instead of running once against a static page. Runs
// entirely inside this effect so StrictMode's dev double-invoke can't leave
// two renderers or two animation loops running at once.
export default function Landing({ onChooseFamily, onChooseElder }) {
  const stageRef = useRef(null)

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const $ = (id) => stage.querySelector('#' + id)
    const H = 520
    const RM = matchMedia('(prefers-reduced-motion: reduce)').matches

    $('hR').innerHTML = HAND
    $('hL').innerHTML = HAND

    const ren = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    ren.setPixelRatio(Math.min(devicePixelRatio, 2))
    ren.setSize(stage.clientWidth, H)
    $('gl').appendChild(ren.domElement)

    const scene = new THREE.Scene()
    const cam = new THREE.PerspectiveCamera(40, stage.clientWidth / H, 0.1, 100)
    cam.position.set(0, 0, 7.5)
    cam.lookAt(0, 0.1, 0)
    scene.add(new THREE.AmbientLight(0xffe4dc, 0.85))
    const dl = new THREE.DirectionalLight(0xffffff, 0.85)
    dl.position.set(2, 3, 5)
    scene.add(dl)

    const grp = new THREE.Group()
    grp.position.y = 0.3
    scene.add(grp)
    const s = 0.18
    const pts = []
    for (let i = 0; i < 600; i++) {
      const t = (i / 600) * 6 * Math.PI
      pts.push(new THREE.Vector3(
        (2 * Math.cos(t) + 5 * Math.cos((2 * t) / 3)) * s,
        (2 * Math.sin(t) - 5 * Math.sin((2 * t) / 3)) * s,
        0.22 * Math.sin((4 * t) / 3)
      ))
    }
    const TS = 800
    const RS = 8
    const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), TS, 0.04, RS, true)
    const pos = geo.attributes.position
    const n = pos.count
    const col = new Float32Array(n * 3)
    const U = new Float32Array(n)
    const SD = new Uint8Array(n)
    for (let v = 0; v < n; v++) {
      U[v] = Math.floor(v / (RS + 1)) / TS
      SD[v] = pos.getX(v) < 0 ? 0 : 1
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3))
    grp.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.4, metalness: 0.1 })))

    const dotG = new THREE.SphereGeometry(0.045, 14, 14)
    const dotM = new THREE.MeshStandardMaterial({ color: 0xfff1ea, roughness: 0.6 })
    const dots = []
    for (let i = -3; i <= 3; i++) {
      for (let j = -3; j <= 3; j++) {
        if (Math.hypot(i, j) <= 3.3) {
          const m = new THREE.Mesh(dotG, dotM)
          m.position.set(i * 0.34, j * 0.34, 0)
          m.userData = { ph: Math.random() * 6, d: Math.hypot(i, j) / 3.3 }
          grp.add(m)
          dots.push(m)
        }
      }
    }

    const B = [0.79, 0.28, 0.42]
    const HOT = [0.97, 0.6, 0.43]
    const FADE = [0.96, 0.8, 0.76]
    let hover = -1, chosen = -1, mx = 0, my = 0, rotY = 0, shownUI = false
    let cyc0 = performance.now()
    let eHold = 0
    let rafId = null
    let cancelled = false

    const lerp = (a, b, k) => a + (b - a) * k
    const cl = (x) => Math.max(0, Math.min(1, x))
    const eo = (x) => 1 - Math.pow(1 - x, 3)
    const ei = (x) => x * x * x
    const CYCLE = 12

    function onMove(e) {
      const r = stage.getBoundingClientRect()
      mx = ((e.clientX - r.left) / r.width) * 2 - 1
      my = ((e.clientY - r.top) / r.height) * 2 - 1
      if (shownUI && chosen < 0) {
        hover = mx < 0 ? 0 : 1
        $('L').style.opacity = hover ? 0.45 : 1
        $('R').style.opacity = hover ? 1 : 0.45
      }
    }
    function onLeave() {
      mx = my = 0
      if (chosen < 0) {
        hover = -1
        $('L').style.opacity = 1
        $('R').style.opacity = 1
      }
    }
    stage.addEventListener('pointermove', onMove)
    stage.addEventListener('pointerleave', onLeave)

    function choose(sd) {
      if (!shownUI || chosen >= 0) return
      chosen = sd === 'L' ? 0 : 1
      $(chosen ? 'L' : 'R').style.opacity = 0.25
      $(sd).style.opacity = 1
      $('msg').textContent = chosen ? 'Welcome home, Amma' : 'Opening the family view'
      $('msg').style.opacity = 1
      setTimeout(() => {
        if (chosen === 1) onChooseElder?.()
        else onChooseFamily?.()
      }, 1500)
    }
    function reset() {
      chosen = -1
      hover = -1
      $('L').style.opacity = 1
      $('R').style.opacity = 1
      $('msg').style.opacity = 0
      cyc0 = performance.now()
    }
    stage.__choose = choose
    stage.__reset = reset

    function handT(sign, p) {
      const x = sign * 130 * (1 - p)
      const r = 14 * (1 - p)
      return `translate(${x},${20 * (1 - p)}) rotate(${sign * r} 120 290)${sign < 0 ? ' translate(240,0) scale(-1,1)' : ''}`
    }

    function frame(now) {
      if (cancelled) return
      const t = now / 1000
      let c = RM ? 6 : ((now - cyc0) / 1000) % CYCLE
      let e

      if (chosen >= 0) {
        e = lerp(eHold, 1, 0.05)
        $('hands').style.opacity = 0
        $('namaste').style.opacity = 0
      } else {
        const hp = eo(cl(c / 1.6))
        $('hR').setAttribute('transform', handT(1, hp))
        $('hL').setAttribute('transform', handT(-1, hp))
        const hf = cl((c - 2.8) / 0.8)
        const hin = cl(c / 0.6)
        $('hands').style.opacity = hin * (1 - hf)
        $('hands').style.transform = `scale(${1 - 0.45 * hf}) translateY(${-30 * hf}px)`
        $('namaste').style.opacity = cl((c - 1.6) / 0.4) * (1 - cl((c - 2.6) / 0.4))
        const rp = cl((c - 1.7) / 0.8)
        $('ring').setAttribute('r', 4 + 66 * rp)
        $('ring').setAttribute('opacity', rp > 0 && rp < 1 ? 0.6 * (1 - rp) : 0)
        e = c < 2.8 ? 0 : c < 6.4 ? eo((c - 2.8) / 3.6) : c < 10.5 ? 1 : c < 11.7 ? 1 - ei((c - 10.5) / 1.2) : 0
        if (!shownUI && c > 2.8) {
          shownUI = true
          ;['title', 'opts'].forEach((i) => {
            $(i).style.opacity = 1
            $(i).style.transform = 'none'
          })
        }
      }

      eHold = e
      geo.setDrawRange(0, Math.floor((geo.index.count * e) / 6) * 6)
      grp.scale.setScalar(0.2 + 0.8 * e)

      for (let v = 0; v < n; v++) {
        const sd = SD[v]
        let base = B
        let k = 0
        if (chosen >= 0) {
          if (sd === chosen) k = 0.7
          else base = FADE
        } else if (hover === sd) k = 0.4
        const q = ((U[v] - t * 0.06) % 1 + 1) % 1
        const g = Math.max(0, 1 - Math.min(q, 1 - q) * 18)
        k = Math.min(1, k + g * (chosen >= 0 && sd !== chosen ? 0.15 : 0.75))
        const i3 = v * 3
        col[i3] = lerp(base[0], HOT[0], k)
        col[i3 + 1] = lerp(base[1], HOT[1], k)
        col[i3 + 2] = lerp(base[2], HOT[2], k)
      }
      geo.attributes.color.needsUpdate = true

      const tx = chosen >= 0 ? (chosen ? -0.2 : 0.2) : mx * 0.3
      const ty = chosen >= 0 ? 0 : my * 0.18
      rotY = lerp(rotY, tx, 0.05)
      grp.rotation.y = rotY
      grp.rotation.x = lerp(grp.rotation.x, ty, 0.05)
      grp.position.y = 0.3 + Math.sin(t * 1.1) * 0.035

      dots.forEach((d) => {
        const vis = cl((e - d.userData.d * 0.8) * 4)
        d.scale.setScalar(vis || 0.001)
        d.position.z = Math.sin(t * 1.5 + d.userData.ph) * 0.04
      })

      ren.render(scene, cam)
      rafId = requestAnimationFrame(frame)
    }
    rafId = requestAnimationFrame(frame)

    const resizeObserver = new ResizeObserver(() => {
      const w = stage.clientWidth
      ren.setSize(w, H)
      cam.aspect = w / H
      cam.updateProjectionMatrix()
    })
    resizeObserver.observe(stage)

    return () => {
      cancelled = true
      if (rafId) cancelAnimationFrame(rafId)
      resizeObserver.disconnect()
      stage.removeEventListener('pointermove', onMove)
      stage.removeEventListener('pointerleave', onLeave)
      geo.dispose()
      dotG.dispose()
      ren.dispose()
      if (ren.domElement.parentNode) ren.domElement.parentNode.removeChild(ren.domElement)
    }
  }, [onChooseFamily, onChooseElder])

  return (
    <div className="bg-peach min-h-screen">
      <div className="max-w-[900px] mx-auto px-5 pt-20 pb-10">
        <h2 className="sr-only">
          KineSense front page with stylised namaste hands that join, a pink kolam
          unfolding from them on a loop, and family and elder options below.
        </h2>
        <div
          ref={stageRef}
          className="relative h-[520px] bg-peach rounded-lg overflow-hidden text-wine"
        >
          <div id="gl" className="absolute inset-0 z-[1]" />
          <div
            id="hands"
            className="absolute left-1/2 top-[112px] w-[200px] h-[250px] -ml-[100px] z-[3] pointer-events-none"
            style={{ transformOrigin: '50% 20%' }}
          >
            <svg viewBox="0 0 240 300" width="200" height="250">
              <circle id="ring" cx="120" cy="30" r="4" fill="none" stroke="#C9476B" strokeWidth="1.2" opacity="0" />
              <g id="hR"></g>
              <g id="hL"></g>
            </svg>
          </div>
          <div
            id="namaste"
            className="font-serif absolute inset-x-0 top-[392px] text-center italic text-xl z-[3] pointer-events-none"
            style={{ color: '#9A4A56', opacity: 0 }}
          >
            namaste
          </div>
          <div
            id="title"
            className="absolute top-6 inset-x-0 text-center z-[2] pointer-events-none transition-[opacity,transform] duration-[1.2s]"
            style={{ opacity: 0, transform: 'translateY(-8px)' }}
          >
            <div className="font-serif text-[52px] leading-none font-medium">KineSense</div>
            <div className="font-serif italic text-xl mt-2" style={{ color: '#9A4A56' }}>
              a sign, and a signal
            </div>
          </div>
          <div
            id="opts"
            className="transition-[opacity,transform] duration-[1.2s]"
            style={{ opacity: 0, transform: 'translateY(10px)' }}
          >
            <div
              id="L"
              className="side absolute left-0 w-1/2 top-[372px] text-center z-[2] pointer-events-none px-5 transition-opacity duration-[0.9s]"
            >
              <div className="font-dev text-lg" style={{ color: '#C9476B' }}>मैं परिवार हूँ</div>
              <div className="font-serif text-[28px] leading-tight">I look after her</div>
              <div
                className="font-serif italic text-[15px] mt-3 inline-flex items-center gap-1.5 pb-0.5"
                style={{ color: '#9A4A56', borderBottom: '1.5px solid #C9476B' }}
              >
                tap to open the family view <span aria-hidden="true">→</span>
              </div>
            </div>
            <div
              id="R"
              className="side absolute right-0 w-1/2 top-[372px] text-center z-[2] pointer-events-none px-5 transition-opacity duration-[0.9s]"
            >
              <div className="font-dev text-lg" style={{ color: '#C9476B' }}>मैं यहाँ रहती हूँ</div>
              <div className="font-serif text-[28px] leading-tight">I live here</div>
              <div className="inline-flex items-center gap-2.5 mt-2">
                <div className="relative w-[34px] h-[34px]">
                  <span
                    className="ring absolute inset-0 rounded-full"
                    style={{ border: '1.5px solid #C9476B' }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-base">🖐</span>
                </div>
                <span className="font-serif italic text-[15px]" style={{ color: '#9A4A56' }}>
                  raise your hand to the mirror
                </span>
              </div>
            </div>
          </div>
          <div
            id="msg"
            className="font-serif absolute inset-x-0 bottom-[22px] text-center text-lg italic z-[2] pointer-events-none transition-opacity duration-500"
            style={{ color: '#C9476B', opacity: 0 }}
          />
          <div
            className="absolute inset-y-0 left-0 w-1/2 cursor-pointer z-[4]"
            onClick={() => stageRef.current?.__choose('L')}
            aria-label="I look after her"
          />
          <div
            className="absolute inset-y-0 right-0 w-1/2 cursor-pointer z-[4]"
            onClick={() => stageRef.current?.__choose('R')}
            aria-label="I live here"
          />
        </div>

        <div className="flex gap-2 flex-wrap mt-4">
          <button
            onClick={() => stageRef.current?.__choose('L')}
            className="bg-white border rounded-full px-4 py-2.5 text-[13px] font-semibold"
            style={{ borderColor: '#E7B99B', color: '#9A4A56' }}
          >
            Tap as family
          </button>
          <button
            onClick={() => stageRef.current?.__choose('R')}
            className="bg-white border rounded-full px-4 py-2.5 text-[13px] font-semibold"
            style={{ borderColor: '#E7B99B', color: '#9A4A56' }}
          >
            Simulate: Amma raises her hand
          </button>
          <button
            onClick={() => stageRef.current?.__reset()}
            className="text-[13px] underline"
            style={{ color: '#9A4A56' }}
          >
            Clear choice
          </button>
        </div>
      </div>
    </div>
  )
}
