/** The same error block the three settings forms all need. */
export function FormErrors({ messages }: { messages: string[] }) {
  if (messages.length === 0) return null;

  return (
    <div className="rounded-card bg-danger-soft p-3 text-sm text-danger-soft-foreground">
      {messages.map((message) => (
        <p key={message}>{message}</p>
      ))}
    </div>
  );
}
