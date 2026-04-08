"use client";

import { useState } from "react";
import Image from "next/image";
import { Star } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface BookEntry {
  id: number;
  title: string;
  author: string;
  coverImage: string;
  trickScore: number;
  plotScore: number;
  characterScore: number;
  notes: string;
}

function HalfStarRating({ score }: { score: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3].map((i) => {
        const diff = score - i;
        if (diff >= 0) {
          return (
            <Star
              key={i}
              className="h-4 w-4 fill-yellow-400 text-yellow-400"
            />
          );
        }
        if (diff > -1) {
          return (
            <span key={i} className="relative inline-block h-4 w-4">
              <Star className="absolute h-4 w-4 text-zinc-300 dark:text-zinc-600" />
              <span className="absolute inset-0 overflow-hidden" style={{ clipPath: "inset(0 50% 0 0)" }}>
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              </span>
            </span>
          );
        }
        return (
          <Star
            key={i}
            className="h-4 w-4 text-zinc-300 dark:text-zinc-600"
          />
        );
      })}
    </span>
  );
}

function RatingRow({ label, score }: { label: string; score: number }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-20 text-muted-foreground">{label}</span>
      <HalfStarRating score={score} />
    </div>
  );
}

const mockBooks: BookEntry[] = [
  {
    id: 1,
    title: "Medium Detective Hisui Jozuka",
    author: "Sako Aizawa",
    coverImage: "/images/books/book1.jpg",
    trickScore: 3,
    plotScore: 3,
    characterScore: 3,
    notes: "Perfect score! Words are redundant here—just go in blind and let the story speak for itself.",
  },
  {
    id: 2,
    title: "Like a Headless Thing That Curses",
    author: "Shinzo Mitsuda",
    coverImage: "/images/books/book2.jpg",
    trickScore: 3,
    plotScore: 3,
    characterScore: 2.5,
    notes: "The absolute pinnacle of traditional Honkaku mystery, featuring a flawlessly crafted atmosphere of horror and suspense! While the Genya Tojo series has never focused much on character development, the sheer brilliance of its tricks and prose makes it easily stand on par with any perfect-score masterpiece.",
  },
  {
    id: 3,
    title: "The Tokyo Zodiac Murders",
    author: "Soji Shimada",
    coverImage: "/images/books/book3.jpg",
    trickScore: 3,
    plotScore: 2,
    characterScore: 2.5,
    notes: "The cornerstone of the Neo-Honkaku mystery, featuring an unprecedented and absolute stroke of genius in its trick! It's a pity that Shimada's prose and narrative crafting at that stage were not quite polished yet. For many, this novel has become an insurmountable peak for a lifetime—including the author himself...",
  },
];

export default function BookNotesGallery() {
  const [selectedBook, setSelectedBook] = useState<BookEntry | null>(null);
  const isOpen = selectedBook !== null;

  return (
    <>
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
        {mockBooks.map((book) => (
          <div key={book.id} className="flex flex-col items-center">
            <button
              onClick={() => setSelectedBook(book)}
              className="group aspect-[3/4] w-full overflow-hidden rounded-3xl shadow-md transition-all duration-300 hover:scale-105 hover:shadow-xl"
            >
              <Image
                src={book.coverImage}
                alt={book.title}
                width={480}
                height={640}
                className="h-full w-full object-cover"
              />
            </button>
            <span className="mt-2 w-full truncate text-center text-xs italic text-muted-foreground sm:text-sm">
              {book.title}
            </span>
          </div>
        ))}
      </div>

      <Dialog
        open={isOpen}
        onOpenChange={(open) => !open && setSelectedBook(null)}
      >
        <DialogContent className="sm:max-w-2xl sm:rounded-2xl">
          <DialogTitle className="sr-only">
            {selectedBook?.title}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Book notes and ratings
          </DialogDescription>

          {selectedBook && (
            <span className="absolute top-3 right-10 flex h-10 w-10 items-center justify-center rounded-full bg-red-600 text-2xl font-bold text-white">
              {selectedBook.trickScore + selectedBook.plotScore + selectedBook.characterScore}
            </span>
          )}

          {selectedBook && (
            <div className="flex flex-col gap-6 sm:flex-row">
              <div className="flex-shrink-0">
                <div className="aspect-[3/4] h-48 overflow-hidden rounded-xl sm:h-64">
                  <Image
                    src={selectedBook.coverImage}
                    alt={selectedBook.title}
                    width={192}
                    height={256}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-3">
                <h2 className="text-xl font-bold text-foreground">
                  {selectedBook.title}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {selectedBook.author}
                </p>
                <div className="mt-1 flex flex-col gap-2">
                  <RatingRow label="Trick" score={selectedBook.trickScore} />
                  <RatingRow label="Plot" score={selectedBook.plotScore} />
                  <RatingRow label="Character" score={selectedBook.characterScore} />
                </div>
                <div className="mt-2 whitespace-pre-line text-sm leading-7 text-muted-foreground">
                  {selectedBook.notes || "No notes yet"}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
