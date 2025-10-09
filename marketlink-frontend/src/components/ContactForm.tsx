"use client";

export default function ContactForm() {
  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    alert("Mock: inquiry sent");
  }

  return (
    <form className="mt-3 grid gap-3" onSubmit={onSubmit}>
      <input name="name" placeholder="Your name" className="rounded-xl border px-3 py-2" />
      <input name="email" placeholder="Your email" className="rounded-xl border px-3 py-2" />
      <textarea name="message" placeholder="Tell us about your needs" className="min-h-[96px] rounded-xl border px-3 py-2" />
      <button type="submit" className="rounded-xl border px-4 py-2 hover:bg-gray-50">
        Send inquiry
      </button>
    </form>
  );
}
