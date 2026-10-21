import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "نبض المشافي - إدارة المستشفيات" },
      { name: "description", content: "تطبيق تجريبي لإدارة ومتابعة المستشفيات بالمؤشرات الحيوية والصندوق والموظفين." },
      { property: "og:title", content: "نبض المشافي - إدارة المستشفيات" },
      { property: "og:description", content: "متابعة الإيرادات والعمليات والأسرة والموظفين والمصروفات لحظياً." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="h-screen w-full bg-background">
      <iframe src="/hospital.html" title="نبض المشافي" className="h-full w-full border-0" />
    </div>
  );
}
