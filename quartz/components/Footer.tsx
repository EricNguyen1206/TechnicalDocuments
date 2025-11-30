import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import style from "./styles/footer.scss"
import { i18n } from "../i18n"

interface Options {
  links: Record<string, string>
}

export default ((opts?: Options) => {
  const Footer: QuartzComponent = ({ displayClass, cfg }: QuartzComponentProps) => {
    const year = new Date().getFullYear()
    const links = opts?.links ?? []
    return (
      <footer class={`${displayClass ?? ""} dark-oled-footer`}>
        <p class="primary-text">
          {i18n(cfg.locale).components.footer.createdWith}{" "}
          <a href="https://ericnguyen1206.github.io/erion-vault/" class="accent-link-violet">Erion Vault</a> © {year}
        </p>
        <ul class="accent-links-list">
          {Object.entries(links).map(([text, link]) => (
            <li key={text}>
              <a href={link} class="accent-link-blue">{text}</a>
            </li>
          ))}
        </ul>
      </footer>
    )
  }

  Footer.css = style
  return Footer
}) satisfies QuartzComponentConstructor
