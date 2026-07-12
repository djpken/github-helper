export default function App() {
  return (
    <main style={{ maxWidth: 480, margin: '0 auto', padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 18 }}>{chrome.i18n.getMessage('modaltitle')}</h1>
      <p style={{ color: '#555' }}>Settings form lands here.</p>
    </main>
  )
}
