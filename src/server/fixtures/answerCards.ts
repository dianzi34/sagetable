import type { AnswerCardData } from "@/types/roundtable";

export const DEMO_THEME_SLUG = "choosing-a-career";
export const DEMO_THEME_NAME = "Choosing a Career";
export const DEMO_QUESTION =
  "I'm not sure I picked the right major. How do I find work I actually love?";

export const DEMO_ANSWER_CARDS: AnswerCardData[] = [
  {
    figure: {
      slug: "mark-twain",
      name: "Mark Twain",
      field: "Writer",
      era: "1835–1910",
    },
    answer: {
      body: "Honestly, I didn't get my career right on the first try. I was a printer, then a riverboat pilot, then a pretty bad silver miner, and only after all that did I start writing. Piloting taught me one thing, though: you learn a river one bend at a time. So don't wait to choose perfectly. Pick something, notice what you love about it, and steer from there.",
      passages: [
        {
          text: "He agreed to teach me the Mississippi River from New Orleans to St. Louis for five hundred dollars, payable out of the first wages I should receive after graduating. I entered upon the small enterprise of 'learning' twelve or thirteen hundred miles of the great Mississippi River with the easy confidence of my time of life. If I had really known what I was about to require of my faculties, I should not have had the courage to begin.",
          workTitle: "Life on the Mississippi",
          workYear: 1883,
          location: "Chapter 6: A Cub-Pilot's Experience",
          explanation:
            "Twain signed up to learn twelve hundred miles of river before he knew how hard it would be. A little nerve can get you started when overthinking would stall you.",
        },
        {
          text: "I have been through the California mill, with all its “dips, spurs and angles, variations and sinuosities.” I have worked there at all the different trades and professions known to the catalogues. I have been everything, from a newspaper editor down to a cow-catcher on a locomotive, and I am encouraged to believe that if there had been a few more occupations to experiment on, I might have made a dazzling success at last, and found out what mysterious designs Providence had in creating me.",
          workTitle: "Mark Twain's Letters — Complete (1853-1910)",
          workYear: 1917,
          location:
            "Vol. II, Ch. IX — Letter to the New York Society of California Pioneers (Oct. 11, 1869)",
          explanation:
            "Twain jokes about trying every job out West to show you do not need a straight path early on. Testing real work helps you cross off poor fits faster.",
        },
      ],
    },
  },
  {
    figure: {
      slug: "marie-curie",
      name: "Marie Curie",
      field: "Physicist & Chemist",
      era: "1867–1934",
    },
    answer: {
      body: "You don't have to pick the right major right away. In my twenties in Poland, I worked as a tutor and loved books, society, and science almost the same. Night after night of quiet study showed me that math and physics pulled me back the most. So I saved my pay to study in Paris. Notice what holds your focus when nobody makes you, and take one clear step toward it.",
      passages: [
        {
          text: "I had not yet decided what path I would choose. I was as much interested in literature and sociology as in science. However, during these years of isolated work, trying little by little to find my real preferences, I finally turned towards mathematics and physics, and resolutely undertook a serious preparation for future work. This work I proposed doing in Paris, and I hoped to save enough money to be able to live and work in that city for some time.",
          workTitle: "Pierre Curie (with Autobiographical Notes)",
          workYear: 1923,
          location: "Autobiographical Notes, Chapter I",
          explanation:
            "Curie explored literature and sociology for years before committing to math and physics in Paris. Give yourself permission to test interests until one wins your steady focus.",
        },
      ],
    },
  },
  {
    figure: {
      slug: "vincent-van-gogh",
      name: "Vincent van Gogh",
      field: "Painter",
      era: "1853–1890",
    },
    answer: {
      body: "If you picked the wrong major, don't stay stuck in it. Before I ever drew a field or a face, I failed at an art shop, tried teaching boys, and flamed out as a preacher. At twenty-seven I picked up a pencil and threw my whole heart into painting real life instead of trying to please buyers. Work that chases quick pay feels hollow fast. Care deeply about what you make, and start fresh from there.",
      passages: [
        {
          text: "Sooner or later a love of Nature always meets with response from people interested in Art. Therefore it is the painter's duty to become absorbed in Nature, to exercise all his intelligence, and put all his feeling into his work so that it may be comprehensible to others. But to work with a view to sell is, in my opinion, not the proper way, neither should we consider the taste of the art-lover--the great painters never did so.",
          workTitle:
            "The Letters of a Post-Impressionist: Being the Familiar Correspondence of Vincent Van Gogh",
          workYear: 1913,
          location: "Letters to His Brother, Extract 3",
          explanation:
            "Van Gogh argues that chasing buyers ruins art, while pouring honest feeling into your craft eventually finds an audience. Build work you truly care about instead of chasing quick approval.",
        },
      ],
    },
  },
];

export const DEMO_NO_MATCH_CARD: AnswerCardData = {
  figure: {
    slug: "helen-keller",
    name: "Helen Keller",
    field: "Writer & Advocate",
    era: "1880–1968",
  },
  answer: null,
};
