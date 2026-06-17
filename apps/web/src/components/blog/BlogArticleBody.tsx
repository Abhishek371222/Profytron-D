interface BlogArticleBodyProps {
  content: string;
}

export function BlogArticleBody({ content }: BlogArticleBodyProps) {
  return (
    <div className="prose-custom text-muted-foreground text-base leading-[1.9] space-y-5">
      {content.split('\n\n').map((block, i) => {
        if (block.startsWith('## ')) {
          return (
            <h2
              key={i}
              className="text-xl font-bold text-foreground mt-10 mb-3 tracking-tight scroll-mt-28"
            >
              {block.replace('## ', '')}
            </h2>
          );
        }

        const parts = block.split(/(\*\*[^*]+\*\*)/g);
        return (
          <p key={i} className="leading-[1.9]">
            {parts.map((part, j) =>
              part.startsWith('**') && part.endsWith('**') ? (
                <strong key={j} className="text-foreground font-semibold">
                  {part.slice(2, -2)}
                </strong>
              ) : (
                part
              ),
            )}
          </p>
        );
      })}
    </div>
  );
}
