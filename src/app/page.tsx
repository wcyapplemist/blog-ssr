const link =
  "font-medium text-zinc-950 underline decoration-zinc-400 underline-offset-4 transition-colors hover:text-zinc-700 dark:text-zinc-50 dark:decoration-zinc-600 dark:hover:text-zinc-300";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center">
      <main className="flex flex-1 w-full max-w-2xl flex-col px-6 py-24">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
          Wang Chenyu
        </h1>
        <section className="mt-6 space-y-6 text-base leading-7 text-zinc-600 dark:text-zinc-400">
          <p>
            I am a postgraduate student pursuing a Graduate Diploma in Systems
            Analysis (GDipSA) at{" "}
            <a
              href="https://www.iss.nus.edu.sg/"
              target="_blank"
              rel="noopener noreferrer"
              className={link}
            >
              NUS-ISS
            </a>
            , and I am currently interning at{" "}
            <a
              href="https://betekk.com/"
              target="_blank"
              rel="noopener noreferrer"
              className={link}
            >
              BETEKK
            </a>
            . With a background in business, I am actively expanding my
            technical skills. My goal as an aspiring professional is to use
            technology to enhance business and financial capabilities, acting as
            a practical bridge between these two fields.
          </p>
          <p>
            Outside of work and study, I am a massive fan of mystery novels. My
            favorite author is{" "}
            <a
              href="https://ja.wikipedia.org/wiki/%E7%99%BD%E4%BA%95%E6%99%BA%E4%B9%8B"
              target="_blank"
              rel="noopener noreferrer"
              className={link}
            >
              Shirai Tomoyuki
            </a>
            .
          </p>
          <p>
            Here are some video courses I highly recommend if you are looking to
            learn:
          </p>
          <ul className="list-disc space-y-2 pl-6 marker:text-zinc-400 dark:marker:text-zinc-600">
            <li>
              <a
                href="https://www.youtube.com/watch?v=W6NZfCO5SIk&t=816s"
                target="_blank"
                rel="noopener noreferrer"
                className={link}
              >
                JavaScript Course for Beginners — Your First Step to Web
                Development
              </a>
            </li>
          </ul>
          <p>
            Feel free to check out my{" "}
            <a href="/docs/Wang%20Chenyu_Resume.pdf" className={link}>
              resume
            </a>{" "}
            and{" "}
            <a
              href="https://github.com/wcyapplemist"
              target="_blank"
              rel="noopener noreferrer"
              className={link}
            >
              code
            </a>
            , or follow me on{" "}
            <a
              href="https://x.com/Applemist314046"
              target="_blank"
              rel="noopener noreferrer"
              className={link}
            >
              X
            </a>
            . Have a great day, and{" "}
            <a href="mailto:E1554094@u.nus.edu" className={link}>
              reach out
            </a>{" "}
            if you'd like to connect!
          </p>
        </section>
      </main>
    </div>
  );
}
