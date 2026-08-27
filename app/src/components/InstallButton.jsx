import { useEffect, useState } from 'react'
import { play } from '../lib/sound.js'

/** 이미 홈 화면/바탕화면에서 실행 중인가 */
function isInstalled() {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  )
}

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

/**
 * 홈 화면(바탕화면) 바로가기 추가 버튼.
 *
 * 크롬·엣지·삼성인터넷은 beforeinstallprompt 이벤트를 주므로 버튼 한 번으로 설치된다.
 * iOS 사파리는 이 이벤트를 지원하지 않아(정책상 브라우저가 직접 띄울 수 없다)
 * 공유 버튼으로 추가하는 방법을 안내한다.
 */
export default function InstallButton() {
  const [prompt, setPrompt] = useState(null)
  const [installed, setInstalled] = useState(isInstalled)
  const [guide, setGuide] = useState(false)

  useEffect(() => {
    const onPrompt = (e) => {
      e.preventDefault() // 브라우저 기본 배너를 막고 우리 버튼으로 유도
      setPrompt(e)
    }
    const onInstalled = () => {
      setInstalled(true)
      setPrompt(null)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (installed) return null
  // 설치 이벤트도 없고 iOS도 아니면 설치할 수 없는 환경이라 버튼을 숨긴다
  if (!prompt && !isIOS()) return null

  async function install() {
    play('click')
    if (!prompt) return setGuide(true) // iOS
    prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') {
      setInstalled(true)
      play('tada')
    }
    setPrompt(null)
  }

  return (
    <>
      <button className="chip" onClick={install} title="바탕화면에 바로가기 추가">
        📲 바로가기 추가
      </button>

      {guide && (
        <div className="modal-back" onClick={() => setGuide(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <h2>📲 홈 화면에 추가하기</h2>
            <p className="sub">아이폰·아이패드는 사파리에서 직접 추가해야 해요.</p>
            <ol style={{ fontSize: 14.5, lineHeight: 2, paddingLeft: 20, margin: '10px 0' }}>
              <li>
                화면 아래 <b>공유 버튼</b> <span style={{ fontSize: 17 }}>⬆️</span> 을 누르세요
              </li>
              <li>
                목록을 내려 <b>"홈 화면에 추가"</b> 를 누르세요
              </li>
              <li>
                오른쪽 위 <b>추가</b> 를 누르면 끝!
              </li>
            </ol>
            <button className="btn block" onClick={() => setGuide(false)}>
              알겠어요
            </button>
          </div>
        </div>
      )}
    </>
  )
}
