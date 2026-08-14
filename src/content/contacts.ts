export interface Contact {
  name: string;
  role: string;
  chatText: string;
}

export const CONTACTS: Contact[] = [
  {
    name: "Priya",
    role: "ex-coworker, now at BigCorp",
    chatText: '"We should grab coffee sometime." You will not grab coffee.',
  },
  {
    name: "Dev_Marcus",
    role: "met at a meetup once",
    chatText: "Sends you a job posting you're wildly underqualified for. It's flattering anyway.",
  },
  {
    name: "Old Manager",
    role: "still owes you a reference",
    chatText: '"Let\'s circle back on that reference." You\'ve heard this before.',
  },
];
