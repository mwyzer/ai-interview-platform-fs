interface ExpandableTextProps {
  text: string;
  className?: string;
}

// Placeholder so the tests in ExpandableText.test.tsx can run and fail on their assertions.
// The real component (collapse, toggle, wrapping) comes with the fix.
export default function ExpandableText({ text, className }: ExpandableTextProps) {
  return <p className={className}>{text}</p>;
}
