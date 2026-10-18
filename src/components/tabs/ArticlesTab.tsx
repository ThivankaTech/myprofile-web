import { Card } from "@/components/Card";
import { formatDate } from "@/lib/dates";
import type { Article } from "@/lib/profile";

interface ArticlesTabProps {
  articles: Article[];
  profileUrl: string;
}

export function ArticlesTab({ articles, profileUrl }: ArticlesTabProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold text-fg">Articles</h1>
          <p className="mt-1 text-sm text-fg-dim">
            {articles.length} article{articles.length === 1 ? "" : "s"} I&apos;ve written about .NET, C# and messaging.
          </p>
        </div>
        {profileUrl && (
          <a
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-accent hover:underline"
          >
            All on Medium ↗
          </a>
        )}
      </div>

      {articles.map((article) => (
        <a
          key={article.url}
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group block rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <Card className="transition-colors group-hover:border-accent group-hover:bg-accent-soft">
            <p className="text-xs font-medium uppercase tracking-wide text-travel">
              {formatDate(article.published)} · {article.readMinutes} min read
            </p>
            <h2 className="mt-1 text-lg font-semibold text-fg">{article.title}</h2>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-medium text-accent"
                >
                  {tag}
                </span>
              ))}
              <span className="ml-auto text-sm font-medium text-accent">
                Read on {article.platform} ↗
              </span>
            </div>
          </Card>
        </a>
      ))}
    </div>
  );
}
