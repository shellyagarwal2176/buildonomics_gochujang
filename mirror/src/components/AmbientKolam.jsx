import { useEffect, useRef } from 'react'
import * as THREE from 'three'

// Ambient background version of the Landing page's namaste/kolam animation
// (dashboard/src/components/Landing.jsx) — same tube-curve visual, stripped
// of the interactive title/hands/choice UI so it can run quietly behind real
// content. Duplicated in mirror/ and dashboard/ rather than a shared
// package — this is the only piece either app needs from the other's
// dependencies, so a shared workspace package isn't worth the setup cost.
export default function AmbientKolam({ className = '' }) {
  const mountRef = useRef(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return
    const RM = matchMedia('(prefers-reduced-motion: reduce)').matches

    const ren = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    ren.setPixelRatio(Math.min(devicePixelRatio, 2))
    const resize = () => ren.setSize(mount.clientWidth, mount.clientHeight)
    resize()
    mount.appendChild(ren.domElement)

    const scene = new THREE.Scene()
    const cam = new THREE.PerspectiveCamera(40, mount.clientWidth / mount.clientHeight || 1, 0.1, 100)
    cam.position.set(0, 0, 7.5)
    scene.add(new THREE.AmbientLight(0xffe4dc, 0.9))
    const dl = new THREE.DirectionalLight(0xffffff, 0.8)
    dl.position.set(2, 3, 5)
    scene.add(dl)

    const grp = new THREE.Group()
    scene.add(grp)
    const s = 0.42
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
    const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), TS, 0.035, RS, true)
    const pos = geo.attributes.position
    const n = pos.count
    const col = new Float32Array(n * 3)
    const U = new Float32Array(n)
    for (let v = 0; v < n; v++) U[v] = Math.floor(v / (RS + 1)) / TS
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3))
    grp.add(new THREE.Mesh(
      geo,
      new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.4, metalness: 0.1, transparent: true, opacity: 0.85 })
    ))

    const B = [0.5, 0.12, 0.22]
    const HOT = [0.72, 0.32, 0.28]
    const lerp = (a, b, k) => a + (b - a) * k
    let rafId = null
    let cancelled = false

    function frame(now) {
      if (cancelled) return
      const t = now / 1000
      for (let v = 0; v < n; v++) {
        const q = ((U[v] - t * 0.05) % 1 + 1) % 1
        const g = Math.max(0, 1 - Math.min(q, 1 - q) * 18)
        const k = Math.min(1, g * 0.8)
        const i3 = v * 3
        col[i3] = lerp(B[0], HOT[0], k)
        col[i3 + 1] = lerp(B[1], HOT[1], k)
        col[i3 + 2] = lerp(B[2], HOT[2], k)
      }
      geo.attributes.color.needsUpdate = true
      if (!RM) {
        grp.rotation.y = Math.sin(t * 0.15) * 0.4
        grp.rotation.x = Math.cos(t * 0.12) * 0.15
        grp.position.y = Math.sin(t * 0.9) * 0.05
      }
      ren.render(scene, cam)
      rafId = requestAnimationFrame(frame)
    }
    rafId = requestAnimationFrame(frame)

    const resizeObserver = new ResizeObserver(() => {
      resize()
      cam.aspect = mount.clientWidth / mount.clientHeight || 1
      cam.updateProjectionMatrix()
    })
    resizeObserver.observe(mount)

    return () => {
      cancelled = true
      if (rafId) cancelAnimationFrame(rafId)
      resizeObserver.disconnect()
      geo.dispose()
      ren.dispose()
      if (ren.domElement.parentNode) ren.domElement.parentNode.removeChild(ren.domElement)
    }
  }, [])

  return <div ref={mountRef} className={className} aria-hidden="true" />
}
