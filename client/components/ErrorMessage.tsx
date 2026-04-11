/**
 * ErrorMessage — displays an API or form error in a styled alert box.
 */
export default function ErrorMessage({ message }: { message: string | null | undefined }) {
  if (!message) return null;
  return (
    <div role="alert" className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
      <strong className="font-medium">Error: </strong>
      {message}
    </div>
  );
}
