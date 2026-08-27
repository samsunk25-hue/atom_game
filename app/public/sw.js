/*
 * 최소한의 서비스 워커.
 * 크롬은 fetch 핸들러가 있는 서비스 워커가 등록돼 있어야 '홈 화면에 추가'를 제안한다.
 *
 * 전략은 네트워크 우선(network-first). 배포 후 새 코드가 바로 반영되도록 항상 네트워크를
 * 먼저 시도하고, 오프라인일 때만 캐시를 쓴다. 캐시 우선으로 하면 학생 기기에 옛 화면이
 * 남아 "선생님 화면과 다르다"는 문제가 생긴다.
 */
const CACHE = 'moodum-v1'

self.addEventListener('install', (e) => {
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return

  e.respondWith(
    fetch(req)
      .then((res) => {
        // 성공한 응답만 복사해 저장 (오프라인 대비)
        if (res && res.status === 200) {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put(req, copy))
        }
        return res
      })
      .catch(async () => {
        const hit = await caches.match(req)
        if (hit) return hit
        // 페이지 이동 요청이면 첫 화면이라도 돌려준다
        if (req.mode === 'navigate') return caches.match('./index.html')
        throw new Error('offline')
      }),
  )
})
