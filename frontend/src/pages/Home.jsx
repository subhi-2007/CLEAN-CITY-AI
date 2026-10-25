
function Home({ setPage }) {
  return (
    <div className="home-page">
      <section className="hero">
        <div className="hero-content">
          <span className="badge">CLEAN CITY AI</span>

          <h1>
            Report Illegal
            <br />
            <span>Garbage Easily.</span>
          </h1>

          <p>
            Upload a photo of the garbage and let our AI identify
            the type of waste. You can then report the garbage
            along with its location.
          </p>

          <button
            className="hero-button"
            onClick={() => setPage("report")}
          >
            Report Garbage
          </button>
        </div>

        <div className="hero-card">
          <div className="upload-icon">♻</div>

          <h2>Report Garbage</h2>

          <p>
            Upload an image and our AI will detect the garbage
            present in it.
          </p>

          <button
            className="card-button"
            onClick={() => setPage("report")}
          >
            Choose Image
          </button>
        </div>
      </section>
    </div>
  );
}

export default Home;