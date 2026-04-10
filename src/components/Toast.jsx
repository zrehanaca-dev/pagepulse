import { useApp } from '../context/AppContext'

export function Toast() {
  const { toastMsg, toastVisible } = useApp()
  return (
    <div className={`toast${toastVisible ? ' show' : ''}`}>
      {toastMsg}
    </div>
  )
}
