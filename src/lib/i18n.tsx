"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export const LANGS = [
  { code: "en", native: "English" },
  { code: "fr", native: "Français" },
  { code: "de", native: "Deutsch" },
  { code: "it", native: "Italiano" },
] as const;

export type Lang = (typeof LANGS)[number]["code"];

const STORAGE_KEY = "destini-lang";

type Dict = Record<string, string>;

const en: Dict = {
  // common
  "common.begin_reading": "Begin Your Reading",
  "common.upload_photo": "Upload Photo",
  "common.photo_selected": "Photo Selected",
  "common.tap_to_change": "Tap photo to change",
  "common.tap_to_upload": "Tap to Upload",

  // brand subtitle
  "nav.insight": "Insight",
  "nav.physiognomy": "Physiognomy",
  "nav.palmistry": "Palmistry",

  // home
  "home.tagline": "Ancient Insight, Ritual Guidance, Inner Healing",
  "home.service.face.title": "Face Reading",
  "home.service.face.desc": "Read the face,\nsee the destiny.",
  "home.service.palm.title": "Palm Reading",
  "home.service.palm.desc": "Read the palm,\nknow your fate.",
  "home.service.bazi.title": "Bazi",
  "home.service.bazi.desc": "Decode your birth chart,\nuncover your path.",
  "home.service.liuyao.title": "Liuyao",
  "home.service.liuyao.desc": "Cast the signs,\nreveal the change.",
  "home.service.naming.title": "Naming",
  "home.service.naming.desc": "A name aligned with fate,\na life in harmony.",
  "home.service.healing.title": "Healing",
  "home.service.healing.desc": "Restore balance,\nrenew your energy.",
  "home.feature.private": "Private",
  "home.feature.private_sub": "Confidential",
  "home.feature.tradition": "Rooted in",
  "home.feature.tradition_sub": "Tradition",
  "home.feature.care": "Guided",
  "home.feature.care_sub": "with Care",
  "home.tagline1": "Honoring Wisdom",
  "home.tagline2": "Respecting Fate",
  "home.tagline3": "Empowering You",

  // face page
  "face.title": "Face Reading",
  "face.upload.subtitle": "A clear front-facing photo",
  "face.req.lighting": "Good Lighting",
  "face.req.no_filters": "No Filters",
  "face.req.centered": "Face Centered",
  "face.req.no_obstruction": "No Obstruction",
  "face.insights": "Reading Insights",
  "face.destiny_principles": "Destiny Principles",
  "face.key_areas": "Key Areas to Observe",
  "face.principle.forehead.title": "Forehead",
  "face.principle.forehead.body": "reveals early fortunes and wisdom.",
  "face.principle.eyes.title": "Eyes",
  "face.principle.eyes.body": "reflect spirit, insight, and emotional clarity.",
  "face.principle.nose.title": "Nose",
  "face.principle.nose.body": "indicates wealth flow, willpower, and stability.",
  "face.principle.mouth.title": "Mouth & Chin",
  "face.principle.mouth.body": "suggest relationships, harmony, and grounding.",
  "face.area.forehead": "Forehead",
  "face.area.cheeks": "Cheeks",
  "face.area.brows": "Brows",
  "face.area.mouth": "Mouth",
  "face.area.eyes": "Eyes",
  "face.area.chin": "Chin",
  "face.area.nose": "Nose",
  "face.area.ears": "Ears",
  "face.trust.private": "Private",
  "face.trust.private_sub": "& Confidential",
  "face.trust.tradition": "Rooted in",
  "face.trust.tradition_sub": "Tradition",
  "face.trust.care": "Guided",
  "face.trust.care_sub": "with Care",
  "face.modal.title": "Face Reading",
  "face.modal.status.loading": "Awakening the ancient gaze…",
  "face.modal.status.detecting": "Reading the contours of your face…",
  "face.modal.status.none": "No face was found. Please try another photo.",
  "face.modal.canon": "The Canon of Ma Yi Shen Xiang",
  "face.feature.forehead.label": "Forehead",
  "face.feature.forehead.reading":
    "A broad, luminous forehead — early fortune shines, learning comes with ease.",
  "face.feature.brow-seal.label": "Brow Seal",
  "face.feature.brow-seal.reading":
    "The seal between the brows is clear — career path unobstructed, ambition aligned.",
  "face.feature.mountain-root.label": "Mountain Root",
  "face.feature.mountain-root.reading":
    "Steady mountain root — strong family foundation and resilient middle years.",
  "face.feature.cheek-right.label": "Cheekbone",
  "face.feature.cheek-right.reading":
    "Rising cheekbone — influence and respect in your prime years.",
  "face.feature.cheek-left.label": "Cheekbone",
  "face.feature.cheek-left.reading":
    "Balanced cheek line — harmony in social and professional circles.",
  "face.feature.philtrum.label": "Philtrum",
  "face.feature.philtrum.reading":
    "Deep and clear philtrum — vitality, longevity, and continuity of lineage.",
  "face.feature.nasolabial-r.label": "Authority Line",
  "face.feature.nasolabial-r.reading":
    "Defined authority line — natural command and a voice that carries weight.",
  "face.feature.nasolabial-l.label": "Authority Line",
  "face.feature.nasolabial-l.reading":
    "Symmetrical authority line — your words shape outcomes around you.",
  "face.feature.lips.label": "Lips",
  "face.feature.lips.reading":
    "Well-formed lips — eloquence, warmth, and abundance in relationships.",
  "face.feature.earth-chamber.label": "Earth Chamber",
  "face.feature.earth-chamber.reading":
    "Rounded earth chamber — prosperity and stability in later years.",

  // palm page
  "palm.title": "Palm Reading",
  "palm.upload.subtitle": "An open palm, fingers spread",
  "palm.req.open": "Open Palm",
  "palm.req.lighting": "Good Lighting",
  "palm.req.centered": "Palm Centered",
  "palm.req.sharp": "Sharp Focus",
  "palm.insights": "Reading Insights",
  "palm.five_lines": "The Five Lines",
  "palm.mounts": "Mounts of the Palm",
  "palm.principle.heart.title": "Heart Line",
  "palm.principle.heart.body": "reveals emotional life, relationships, and capacity for love.",
  "palm.principle.head.title": "Head Line",
  "palm.principle.head.body": "reflects intellect, mindset, and decision-making style.",
  "palm.principle.life.title": "Life Line",
  "palm.principle.life.body": "indicates vitality, resilience, and life's overall flow.",
  "palm.principle.fate.title": "Fate Line",
  "palm.principle.fate.body": "traces career, calling, and the unseen hand of destiny.",
  "palm.principle.marriage.title": "Marriage Line",
  "palm.principle.marriage.body": "marks partnership, union, and lasting companionship.",
  "palm.area.jupiter": "Jupiter Mount",
  "palm.area.saturn": "Saturn Mount",
  "palm.area.apollo": "Apollo Mount",
  "palm.area.mercury": "Mercury Mount",
  "palm.area.mars": "Mars Plain",
  "palm.area.venus": "Venus Mount",
  "palm.area.luna": "Luna Mount",
  "palm.area.wrist": "Wrist Bracelet",
  "palm.trust.private": "Private",
  "palm.trust.private_sub": "& Confidential",
  "palm.trust.tradition": "Rooted in",
  "palm.trust.tradition_sub": "Tradition",
  "palm.trust.care": "Guided",
  "palm.trust.care_sub": "with Care",
  "palm.modal.title": "Palm Reading",
  "palm.modal.status.loading": "Awakening the ancient gaze…",
  "palm.modal.status.detecting": "Reading the lines of your palm…",
  "palm.modal.status.extracting": "Tracing your palm's creases…",
  "palm.modal.status.none": "No palm was found. Please try another photo.",
  "palm.modal.status.empty":
    "Could not trace the lines clearly. Try a sharper, well-lit photo.",
  "palm.modal.five_lines": "The Five Lines of the Palm",
  "palm.line.heart.label": "Heart Line",
  "palm.line.heart.reading":
    "A flowing heart line — affection runs deep, your bonds steady and true.",
  "palm.line.head.label": "Head Line",
  "palm.line.head.reading":
    "A clear head line — sharp judgment, the mind walks its own measured path.",
  "palm.line.life.label": "Life Line",
  "palm.line.life.reading":
    "A long, curving life line — vitality endures, the body weathers each season.",
  "palm.line.fate.label": "Fate Line",
  "palm.line.fate.reading":
    "A rising fate line — destiny inscribes itself; the work of your hands will be seen.",
  "palm.line.marriage.label": "Marriage Line",
  "palm.line.marriage.reading":
    "A clear marriage line — partnership finds its season, the union endures.",

  // email gate
  "email.complete": "Analysis Complete",
  "email.instruction": "Enter your email below to receive your free analysis report.",
  "email.placeholder": "your@email.com",
  "email.invalid": "Please enter a valid email address.",
  "email.submit": "Submit",
  "email.submitted": "Submitted Successfully",
  "email.sent": "Your report has been sent to your inbox. Tap below to view your analysis now.",
  "email.view_report": "View Analysis Report",
};

const fr: Dict = {
  "common.begin_reading": "Commencer la lecture",
  "common.upload_photo": "Téléverser une photo",
  "common.photo_selected": "Photo sélectionnée",
  "common.tap_to_change": "Touchez la photo pour changer",
  "common.tap_to_upload": "Touchez pour téléverser",

  "nav.insight": "Vision",
  "nav.physiognomy": "Physiognomonie",
  "nav.palmistry": "Chiromancie",

  "home.tagline": "Sagesse ancienne, Guidance rituelle, Guérison intérieure",
  "home.service.face.title": "Lecture du visage",
  "home.service.face.desc": "Lire le visage,\nvoir le destin.",
  "home.service.palm.title": "Lecture de la paume",
  "home.service.palm.desc": "Lire la paume,\nconnaître son destin.",
  "home.service.bazi.title": "Bazi",
  "home.service.bazi.desc": "Décodez votre thème natal,\ndécouvrez votre voie.",
  "home.service.liuyao.title": "Liuyao",
  "home.service.liuyao.desc": "Jetez les signes,\nrévélez le changement.",
  "home.service.naming.title": "Nomination",
  "home.service.naming.desc": "Un nom aligné au destin,\nune vie en harmonie.",
  "home.service.healing.title": "Guérison",
  "home.service.healing.desc": "Rétablir l'équilibre,\nrenouveler votre énergie.",
  "home.feature.private": "Privé",
  "home.feature.private_sub": "Confidentiel",
  "home.feature.tradition": "Ancré dans",
  "home.feature.tradition_sub": "la Tradition",
  "home.feature.care": "Guidé",
  "home.feature.care_sub": "avec Soin",
  "home.tagline1": "Honorer la Sagesse",
  "home.tagline2": "Respecter le Destin",
  "home.tagline3": "Vous Donner Pouvoir",

  "face.title": "Lecture du visage",
  "face.upload.subtitle": "Une photo de face nette",
  "face.req.lighting": "Bon éclairage",
  "face.req.no_filters": "Sans filtres",
  "face.req.centered": "Visage centré",
  "face.req.no_obstruction": "Sans obstruction",
  "face.insights": "Aperçus de lecture",
  "face.destiny_principles": "Principes du destin",
  "face.key_areas": "Zones clés à observer",
  "face.principle.forehead.title": "Le front",
  "face.principle.forehead.body": "révèle les fortunes précoces et la sagesse.",
  "face.principle.eyes.title": "Les yeux",
  "face.principle.eyes.body": "reflètent l'esprit, la perspicacité et la clarté émotionnelle.",
  "face.principle.nose.title": "Le nez",
  "face.principle.nose.body": "indique le flux de richesse, la volonté et la stabilité.",
  "face.principle.mouth.title": "Bouche & menton",
  "face.principle.mouth.body": "suggèrent les relations, l'harmonie et l'ancrage.",
  "face.area.forehead": "Front",
  "face.area.cheeks": "Joues",
  "face.area.brows": "Sourcils",
  "face.area.mouth": "Bouche",
  "face.area.eyes": "Yeux",
  "face.area.chin": "Menton",
  "face.area.nose": "Nez",
  "face.area.ears": "Oreilles",
  "face.trust.private": "Privé",
  "face.trust.private_sub": "& Confidentiel",
  "face.trust.tradition": "Ancré dans",
  "face.trust.tradition_sub": "la Tradition",
  "face.trust.care": "Guidé",
  "face.trust.care_sub": "avec Soin",
  "face.modal.title": "Lecture du visage",
  "face.modal.status.loading": "Réveil du regard ancien…",
  "face.modal.status.detecting": "Lecture des contours de votre visage…",
  "face.modal.status.none": "Aucun visage trouvé. Essayez une autre photo.",
  "face.modal.canon": "Le canon de Ma Yi Shen Xiang",
  "face.feature.forehead.label": "Front",
  "face.feature.forehead.reading":
    "Un front large et lumineux — la fortune précoce rayonne, l'apprentissage vient avec aisance.",
  "face.feature.brow-seal.label": "Sceau des sourcils",
  "face.feature.brow-seal.reading":
    "Le sceau entre les sourcils est clair — le chemin de carrière est libre, l'ambition alignée.",
  "face.feature.mountain-root.label": "Racine de la montagne",
  "face.feature.mountain-root.reading":
    "Racine de la montagne stable — fondation familiale forte et années intermédiaires résilientes.",
  "face.feature.cheek-right.label": "Pommette",
  "face.feature.cheek-right.reading":
    "Pommette saillante — influence et respect dans vos années de pleine maturité.",
  "face.feature.cheek-left.label": "Pommette",
  "face.feature.cheek-left.reading":
    "Ligne de joue équilibrée — harmonie dans les cercles sociaux et professionnels.",
  "face.feature.philtrum.label": "Philtrum",
  "face.feature.philtrum.reading":
    "Philtrum profond et net — vitalité, longévité et continuité de la lignée.",
  "face.feature.nasolabial-r.label": "Ligne d'autorité",
  "face.feature.nasolabial-r.reading":
    "Ligne d'autorité définie — commandement naturel et une voix qui porte.",
  "face.feature.nasolabial-l.label": "Ligne d'autorité",
  "face.feature.nasolabial-l.reading":
    "Ligne d'autorité symétrique — vos paroles façonnent les événements autour de vous.",
  "face.feature.lips.label": "Lèvres",
  "face.feature.lips.reading":
    "Lèvres bien dessinées — éloquence, chaleur et abondance dans les relations.",
  "face.feature.earth-chamber.label": "Chambre de la terre",
  "face.feature.earth-chamber.reading":
    "Chambre de la terre arrondie — prospérité et stabilité dans les années tardives.",

  "palm.title": "Lecture de la paume",
  "palm.upload.subtitle": "Une paume ouverte, doigts écartés",
  "palm.req.open": "Paume ouverte",
  "palm.req.lighting": "Bon éclairage",
  "palm.req.centered": "Paume centrée",
  "palm.req.sharp": "Mise au point nette",
  "palm.insights": "Aperçus de lecture",
  "palm.five_lines": "Les cinq lignes",
  "palm.mounts": "Monts de la paume",
  "palm.principle.heart.title": "Ligne du cœur",
  "palm.principle.heart.body": "révèle la vie émotionnelle, les relations et la capacité d'aimer.",
  "palm.principle.head.title": "Ligne de tête",
  "palm.principle.head.body": "reflète l'intellect, la mentalité et la prise de décision.",
  "palm.principle.life.title": "Ligne de vie",
  "palm.principle.life.body": "indique la vitalité, la résilience et le cours général de la vie.",
  "palm.principle.fate.title": "Ligne du destin",
  "palm.principle.fate.body": "trace la carrière, la vocation et la main invisible du destin.",
  "palm.principle.marriage.title": "Ligne de mariage",
  "palm.principle.marriage.body": "marque le partenariat, l'union et la compagnie durable.",
  "palm.area.jupiter": "Mont de Jupiter",
  "palm.area.saturn": "Mont de Saturne",
  "palm.area.apollo": "Mont d'Apollon",
  "palm.area.mercury": "Mont de Mercure",
  "palm.area.mars": "Plaine de Mars",
  "palm.area.venus": "Mont de Vénus",
  "palm.area.luna": "Mont de la Lune",
  "palm.area.wrist": "Bracelet du poignet",
  "palm.trust.private": "Privé",
  "palm.trust.private_sub": "& Confidentiel",
  "palm.trust.tradition": "Ancré dans",
  "palm.trust.tradition_sub": "la Tradition",
  "palm.trust.care": "Guidé",
  "palm.trust.care_sub": "avec Soin",
  "palm.modal.title": "Lecture de la paume",
  "palm.modal.status.loading": "Réveil du regard ancien…",
  "palm.modal.status.detecting": "Lecture des lignes de votre paume…",
  "palm.modal.status.extracting": "Tracé des plis de votre paume…",
  "palm.modal.status.none": "Aucune paume trouvée. Essayez une autre photo.",
  "palm.modal.status.empty":
    "Impossible de tracer les lignes clairement. Essayez une photo plus nette et bien éclairée.",
  "palm.modal.five_lines": "Les cinq lignes de la paume",
  "palm.line.heart.label": "Ligne du cœur",
  "palm.line.heart.reading":
    "Une ligne de cœur fluide — l'affection est profonde, vos liens sont stables et vrais.",
  "palm.line.head.label": "Ligne de tête",
  "palm.line.head.reading":
    "Une ligne de tête claire — jugement aiguisé, l'esprit suit son propre chemin mesuré.",
  "palm.line.life.label": "Ligne de vie",
  "palm.line.life.reading":
    "Une longue ligne de vie courbe — la vitalité perdure, le corps traverse chaque saison.",
  "palm.line.fate.label": "Ligne du destin",
  "palm.line.fate.reading":
    "Une ligne du destin ascendante — le destin s'inscrit ; le travail de vos mains sera vu.",
  "palm.line.marriage.label": "Ligne de mariage",
  "palm.line.marriage.reading":
    "Une ligne de mariage claire — le partenariat trouve sa saison, l'union perdure.",

  "email.complete": "Analyse terminée",
  "email.instruction":
    "Saisissez votre email ci-dessous pour recevoir votre rapport d'analyse gratuit.",
  "email.placeholder": "votre@email.com",
  "email.invalid": "Veuillez saisir une adresse email valide.",
  "email.submit": "Envoyer",
  "email.submitted": "Envoyé avec succès",
  "email.sent":
    "Votre rapport a été envoyé dans votre boîte. Touchez ci-dessous pour voir votre analyse maintenant.",
  "email.view_report": "Voir le rapport d'analyse",
};

const de: Dict = {
  "common.begin_reading": "Lesung beginnen",
  "common.upload_photo": "Foto hochladen",
  "common.photo_selected": "Foto ausgewählt",
  "common.tap_to_change": "Foto antippen zum Ändern",
  "common.tap_to_upload": "Antippen zum Hochladen",

  "nav.insight": "Einblick",
  "nav.physiognomy": "Physiognomie",
  "nav.palmistry": "Handlesen",

  "home.tagline": "Alte Weisheit, rituelle Führung, innere Heilung",
  "home.service.face.title": "Gesichtslesen",
  "home.service.face.desc": "Lies das Gesicht,\nerkenne das Schicksal.",
  "home.service.palm.title": "Handlesen",
  "home.service.palm.desc": "Lies die Hand,\nerkenne dein Schicksal.",
  "home.service.bazi.title": "Bazi",
  "home.service.bazi.desc": "Entschlüssele dein Geburtsbild,\nentdecke deinen Weg.",
  "home.service.liuyao.title": "Liuyao",
  "home.service.liuyao.desc": "Wirf die Zeichen,\nzeige den Wandel.",
  "home.service.naming.title": "Namensgebung",
  "home.service.naming.desc": "Ein Name im Einklang mit dem Schicksal,\nein Leben in Harmonie.",
  "home.service.healing.title": "Heilung",
  "home.service.healing.desc": "Balance wiederherstellen,\nEnergie erneuern.",
  "home.feature.private": "Privat",
  "home.feature.private_sub": "Vertraulich",
  "home.feature.tradition": "Verwurzelt in",
  "home.feature.tradition_sub": "Tradition",
  "home.feature.care": "Geführt",
  "home.feature.care_sub": "mit Sorgfalt",
  "home.tagline1": "Weisheit ehren",
  "home.tagline2": "Schicksal achten",
  "home.tagline3": "Dich stärken",

  "face.title": "Gesichtslesen",
  "face.upload.subtitle": "Ein klares Frontalfoto",
  "face.req.lighting": "Gutes Licht",
  "face.req.no_filters": "Keine Filter",
  "face.req.centered": "Gesicht zentriert",
  "face.req.no_obstruction": "Keine Verdeckung",
  "face.insights": "Lese-Einblicke",
  "face.destiny_principles": "Schicksalsprinzipien",
  "face.key_areas": "Wichtige Bereiche",
  "face.principle.forehead.title": "Stirn",
  "face.principle.forehead.body": "offenbart frühe Glücksfälle und Weisheit.",
  "face.principle.eyes.title": "Augen",
  "face.principle.eyes.body": "spiegeln Geist, Einsicht und emotionale Klarheit wider.",
  "face.principle.nose.title": "Nase",
  "face.principle.nose.body": "zeigt Wohlstandsfluss, Willenskraft und Stabilität.",
  "face.principle.mouth.title": "Mund & Kinn",
  "face.principle.mouth.body": "deuten auf Beziehungen, Harmonie und Erdung hin.",
  "face.area.forehead": "Stirn",
  "face.area.cheeks": "Wangen",
  "face.area.brows": "Brauen",
  "face.area.mouth": "Mund",
  "face.area.eyes": "Augen",
  "face.area.chin": "Kinn",
  "face.area.nose": "Nase",
  "face.area.ears": "Ohren",
  "face.trust.private": "Privat",
  "face.trust.private_sub": "& Vertraulich",
  "face.trust.tradition": "Verwurzelt in",
  "face.trust.tradition_sub": "Tradition",
  "face.trust.care": "Geführt",
  "face.trust.care_sub": "mit Sorgfalt",
  "face.modal.title": "Gesichtslesen",
  "face.modal.status.loading": "Erwecken des alten Blicks…",
  "face.modal.status.detecting": "Lesen der Konturen Ihres Gesichts…",
  "face.modal.status.none": "Kein Gesicht gefunden. Bitte ein anderes Foto versuchen.",
  "face.modal.canon": "Der Kanon von Ma Yi Shen Xiang",
  "face.feature.forehead.label": "Stirn",
  "face.feature.forehead.reading":
    "Eine breite, strahlende Stirn — frühes Glück leuchtet, Lernen fällt leicht.",
  "face.feature.brow-seal.label": "Brauensiegel",
  "face.feature.brow-seal.reading":
    "Das Siegel zwischen den Brauen ist klar — Karriereweg frei, Ambition im Einklang.",
  "face.feature.mountain-root.label": "Bergwurzel",
  "face.feature.mountain-root.reading":
    "Stabile Bergwurzel — starke Familienbasis und belastbare mittlere Jahre.",
  "face.feature.cheek-right.label": "Wangenknochen",
  "face.feature.cheek-right.reading":
    "Hervorstehender Wangenknochen — Einfluss und Respekt in den besten Jahren.",
  "face.feature.cheek-left.label": "Wangenknochen",
  "face.feature.cheek-left.reading":
    "Ausgeglichene Wangenlinie — Harmonie in sozialen und beruflichen Kreisen.",
  "face.feature.philtrum.label": "Philtrum",
  "face.feature.philtrum.reading":
    "Tiefes und klares Philtrum — Vitalität, Langlebigkeit und Kontinuität der Linie.",
  "face.feature.nasolabial-r.label": "Autoritätslinie",
  "face.feature.nasolabial-r.reading":
    "Klare Autoritätslinie — natürliche Führungskraft und eine Stimme, die Gewicht hat.",
  "face.feature.nasolabial-l.label": "Autoritätslinie",
  "face.feature.nasolabial-l.reading":
    "Symmetrische Autoritätslinie — Ihre Worte gestalten Ergebnisse um Sie herum.",
  "face.feature.lips.label": "Lippen",
  "face.feature.lips.reading":
    "Wohlgeformte Lippen — Beredsamkeit, Wärme und Fülle in Beziehungen.",
  "face.feature.earth-chamber.label": "Erdkammer",
  "face.feature.earth-chamber.reading":
    "Runde Erdkammer — Wohlstand und Stabilität in späteren Jahren.",

  "palm.title": "Handlesen",
  "palm.upload.subtitle": "Eine offene Hand, gespreizte Finger",
  "palm.req.open": "Offene Hand",
  "palm.req.lighting": "Gutes Licht",
  "palm.req.centered": "Hand zentriert",
  "palm.req.sharp": "Scharfer Fokus",
  "palm.insights": "Lese-Einblicke",
  "palm.five_lines": "Die fünf Linien",
  "palm.mounts": "Hügel der Hand",
  "palm.principle.heart.title": "Herzlinie",
  "palm.principle.heart.body":
    "offenbart Gefühlsleben, Beziehungen und Liebesfähigkeit.",
  "palm.principle.head.title": "Kopflinie",
  "palm.principle.head.body": "spiegelt Intellekt, Denkweise und Entscheidungsstil wider.",
  "palm.principle.life.title": "Lebenslinie",
  "palm.principle.life.body": "zeigt Vitalität, Widerstandskraft und den Fluss des Lebens.",
  "palm.principle.fate.title": "Schicksalslinie",
  "palm.principle.fate.body":
    "verfolgt Karriere, Berufung und die unsichtbare Hand des Schicksals.",
  "palm.principle.marriage.title": "Ehelinie",
  "palm.principle.marriage.body":
    "kennzeichnet Partnerschaft, Verbindung und dauerhafte Begleitung.",
  "palm.area.jupiter": "Jupiterhügel",
  "palm.area.saturn": "Saturnhügel",
  "palm.area.apollo": "Apollohügel",
  "palm.area.mercury": "Merkurhügel",
  "palm.area.mars": "Marsfeld",
  "palm.area.venus": "Venushügel",
  "palm.area.luna": "Mondhügel",
  "palm.area.wrist": "Handgelenksband",
  "palm.trust.private": "Privat",
  "palm.trust.private_sub": "& Vertraulich",
  "palm.trust.tradition": "Verwurzelt in",
  "palm.trust.tradition_sub": "Tradition",
  "palm.trust.care": "Geführt",
  "palm.trust.care_sub": "mit Sorgfalt",
  "palm.modal.title": "Handlesen",
  "palm.modal.status.loading": "Erwecken des alten Blicks…",
  "palm.modal.status.detecting": "Lesen der Linien Ihrer Hand…",
  "palm.modal.status.extracting": "Nachzeichnen der Falten Ihrer Hand…",
  "palm.modal.status.none": "Keine Hand gefunden. Bitte ein anderes Foto versuchen.",
  "palm.modal.status.empty":
    "Linien nicht klar erkennbar. Versuchen Sie ein schärferes, gut beleuchtetes Foto.",
  "palm.modal.five_lines": "Die fünf Linien der Hand",
  "palm.line.heart.label": "Herzlinie",
  "palm.line.heart.reading":
    "Eine fließende Herzlinie — Zuneigung läuft tief, Bindungen stetig und wahr.",
  "palm.line.head.label": "Kopflinie",
  "palm.line.head.reading":
    "Eine klare Kopflinie — scharfes Urteil, der Geist geht seinen eigenen, abgewogenen Weg.",
  "palm.line.life.label": "Lebenslinie",
  "palm.line.life.reading":
    "Eine lange, geschwungene Lebenslinie — Vitalität dauert, der Körper trotzt jeder Jahreszeit.",
  "palm.line.fate.label": "Schicksalslinie",
  "palm.line.fate.reading":
    "Eine aufsteigende Schicksalslinie — das Schicksal schreibt sich ein; das Werk Ihrer Hände wird gesehen.",
  "palm.line.marriage.label": "Ehelinie",
  "palm.line.marriage.reading":
    "Eine klare Ehelinie — Partnerschaft findet ihre Zeit, die Verbindung hält.",

  "email.complete": "Analyse abgeschlossen",
  "email.instruction":
    "Geben Sie unten Ihre E-Mail ein, um Ihren kostenlosen Analysebericht zu erhalten.",
  "email.placeholder": "ihre@email.com",
  "email.invalid": "Bitte geben Sie eine gültige E-Mail-Adresse ein.",
  "email.submit": "Absenden",
  "email.submitted": "Erfolgreich gesendet",
  "email.sent":
    "Ihr Bericht wurde an Ihren Posteingang gesendet. Tippen Sie unten, um Ihre Analyse jetzt anzusehen.",
  "email.view_report": "Analysebericht ansehen",
};

const it: Dict = {
  "common.begin_reading": "Inizia la lettura",
  "common.upload_photo": "Carica foto",
  "common.photo_selected": "Foto selezionata",
  "common.tap_to_change": "Tocca la foto per cambiare",
  "common.tap_to_upload": "Tocca per caricare",

  "nav.insight": "Visione",
  "nav.physiognomy": "Fisiognomica",
  "nav.palmistry": "Chiromanzia",

  "home.tagline": "Saggezza antica, Guida rituale, Guarigione interiore",
  "home.service.face.title": "Lettura del volto",
  "home.service.face.desc": "Leggi il volto,\nvedi il destino.",
  "home.service.palm.title": "Lettura della mano",
  "home.service.palm.desc": "Leggi la mano,\nconosci il tuo destino.",
  "home.service.bazi.title": "Bazi",
  "home.service.bazi.desc": "Decodifica il tuo tema natale,\nscopri il tuo cammino.",
  "home.service.liuyao.title": "Liuyao",
  "home.service.liuyao.desc": "Lancia i segni,\nrivela il cambiamento.",
  "home.service.naming.title": "Nominazione",
  "home.service.naming.desc": "Un nome allineato al destino,\nuna vita in armonia.",
  "home.service.healing.title": "Guarigione",
  "home.service.healing.desc": "Ristabilire l'equilibrio,\nrinnovare l'energia.",
  "home.feature.private": "Privato",
  "home.feature.private_sub": "Riservato",
  "home.feature.tradition": "Radicato nella",
  "home.feature.tradition_sub": "Tradizione",
  "home.feature.care": "Guidato",
  "home.feature.care_sub": "con Cura",
  "home.tagline1": "Onorare la Saggezza",
  "home.tagline2": "Rispettare il Destino",
  "home.tagline3": "Darti Forza",

  "face.title": "Lettura del volto",
  "face.upload.subtitle": "Una foto frontale chiara",
  "face.req.lighting": "Buona luce",
  "face.req.no_filters": "Senza filtri",
  "face.req.centered": "Volto centrato",
  "face.req.no_obstruction": "Senza ostruzioni",
  "face.insights": "Approfondimenti",
  "face.destiny_principles": "Principi del destino",
  "face.key_areas": "Aree chiave da osservare",
  "face.principle.forehead.title": "Fronte",
  "face.principle.forehead.body": "rivela le fortune precoci e la saggezza.",
  "face.principle.eyes.title": "Occhi",
  "face.principle.eyes.body": "riflettono spirito, intuizione e chiarezza emotiva.",
  "face.principle.nose.title": "Naso",
  "face.principle.nose.body": "indica flusso di ricchezza, volontà e stabilità.",
  "face.principle.mouth.title": "Bocca & mento",
  "face.principle.mouth.body": "suggeriscono relazioni, armonia e radicamento.",
  "face.area.forehead": "Fronte",
  "face.area.cheeks": "Guance",
  "face.area.brows": "Sopracciglia",
  "face.area.mouth": "Bocca",
  "face.area.eyes": "Occhi",
  "face.area.chin": "Mento",
  "face.area.nose": "Naso",
  "face.area.ears": "Orecchie",
  "face.trust.private": "Privato",
  "face.trust.private_sub": "& Riservato",
  "face.trust.tradition": "Radicato nella",
  "face.trust.tradition_sub": "Tradizione",
  "face.trust.care": "Guidato",
  "face.trust.care_sub": "con Cura",
  "face.modal.title": "Lettura del volto",
  "face.modal.status.loading": "Risveglio dello sguardo antico…",
  "face.modal.status.detecting": "Lettura dei contorni del tuo volto…",
  "face.modal.status.none": "Nessun volto trovato. Prova un'altra foto.",
  "face.modal.canon": "Il canone di Ma Yi Shen Xiang",
  "face.feature.forehead.label": "Fronte",
  "face.feature.forehead.reading":
    "Una fronte ampia e luminosa — fortuna precoce splendente, l'apprendimento è facile.",
  "face.feature.brow-seal.label": "Sigillo delle sopracciglia",
  "face.feature.brow-seal.reading":
    "Il sigillo tra le sopracciglia è chiaro — carriera senza ostacoli, ambizione allineata.",
  "face.feature.mountain-root.label": "Radice della montagna",
  "face.feature.mountain-root.reading":
    "Radice della montagna salda — fondamenta familiari solide e anni di mezzo resilienti.",
  "face.feature.cheek-right.label": "Zigomo",
  "face.feature.cheek-right.reading":
    "Zigomo prominente — influenza e rispetto negli anni di pienezza.",
  "face.feature.cheek-left.label": "Zigomo",
  "face.feature.cheek-left.reading":
    "Linea di guancia equilibrata — armonia nei circoli sociali e professionali.",
  "face.feature.philtrum.label": "Filtro",
  "face.feature.philtrum.reading":
    "Filtro profondo e nitido — vitalità, longevità e continuità del lignaggio.",
  "face.feature.nasolabial-r.label": "Linea dell'autorità",
  "face.feature.nasolabial-r.reading":
    "Linea dell'autorità definita — comando naturale e una voce che pesa.",
  "face.feature.nasolabial-l.label": "Linea dell'autorità",
  "face.feature.nasolabial-l.reading":
    "Linea dell'autorità simmetrica — le tue parole modellano gli esiti attorno a te.",
  "face.feature.lips.label": "Labbra",
  "face.feature.lips.reading":
    "Labbra ben formate — eloquenza, calore e abbondanza nelle relazioni.",
  "face.feature.earth-chamber.label": "Camera della terra",
  "face.feature.earth-chamber.reading":
    "Camera della terra arrotondata — prosperità e stabilità negli anni più tardi.",

  "palm.title": "Lettura della mano",
  "palm.upload.subtitle": "Mano aperta, dita allargate",
  "palm.req.open": "Mano aperta",
  "palm.req.lighting": "Buona luce",
  "palm.req.centered": "Mano centrata",
  "palm.req.sharp": "Messa a fuoco nitida",
  "palm.insights": "Approfondimenti",
  "palm.five_lines": "Le cinque linee",
  "palm.mounts": "Monti della mano",
  "palm.principle.heart.title": "Linea del cuore",
  "palm.principle.heart.body": "rivela vita emotiva, relazioni e capacità d'amare.",
  "palm.principle.head.title": "Linea della testa",
  "palm.principle.head.body": "riflette intelletto, mentalità e stile decisionale.",
  "palm.principle.life.title": "Linea della vita",
  "palm.principle.life.body": "indica vitalità, resilienza e il flusso generale della vita.",
  "palm.principle.fate.title": "Linea del destino",
  "palm.principle.fate.body": "traccia carriera, vocazione e la mano invisibile del destino.",
  "palm.principle.marriage.title": "Linea del matrimonio",
  "palm.principle.marriage.body": "segna il partenariato, l'unione e la compagnia duratura.",
  "palm.area.jupiter": "Monte di Giove",
  "palm.area.saturn": "Monte di Saturno",
  "palm.area.apollo": "Monte di Apollo",
  "palm.area.mercury": "Monte di Mercurio",
  "palm.area.mars": "Piana di Marte",
  "palm.area.venus": "Monte di Venere",
  "palm.area.luna": "Monte della Luna",
  "palm.area.wrist": "Bracciale del polso",
  "palm.trust.private": "Privato",
  "palm.trust.private_sub": "& Riservato",
  "palm.trust.tradition": "Radicato nella",
  "palm.trust.tradition_sub": "Tradizione",
  "palm.trust.care": "Guidato",
  "palm.trust.care_sub": "con Cura",
  "palm.modal.title": "Lettura della mano",
  "palm.modal.status.loading": "Risveglio dello sguardo antico…",
  "palm.modal.status.detecting": "Lettura delle linee della tua mano…",
  "palm.modal.status.extracting": "Tracciamento delle pieghe della mano…",
  "palm.modal.status.none": "Nessuna mano trovata. Prova un'altra foto.",
  "palm.modal.status.empty":
    "Linee non chiaramente tracciabili. Prova una foto più nitida e ben illuminata.",
  "palm.modal.five_lines": "Le cinque linee della mano",
  "palm.line.heart.label": "Linea del cuore",
  "palm.line.heart.reading":
    "Una linea del cuore fluente — l'affetto è profondo, i tuoi legami saldi e veri.",
  "palm.line.head.label": "Linea della testa",
  "palm.line.head.reading":
    "Una linea della testa chiara — giudizio acuto, la mente segue il proprio sentiero misurato.",
  "palm.line.life.label": "Linea della vita",
  "palm.line.life.reading":
    "Una lunga linea della vita curva — la vitalità persiste, il corpo affronta ogni stagione.",
  "palm.line.fate.label": "Linea del destino",
  "palm.line.fate.reading":
    "Una linea del destino ascendente — il destino si iscrive; l'opera delle tue mani sarà vista.",
  "palm.line.marriage.label": "Linea del matrimonio",
  "palm.line.marriage.reading":
    "Una linea del matrimonio chiara — il partenariato trova la sua stagione, l'unione dura.",

  "email.complete": "Analisi completata",
  "email.instruction":
    "Inserisci la tua email qui sotto per ricevere il tuo rapporto di analisi gratuito.",
  "email.placeholder": "tua@email.com",
  "email.invalid": "Inserisci un indirizzo email valido.",
  "email.submit": "Invia",
  "email.submitted": "Inviato con successo",
  "email.sent":
    "Il tuo rapporto è stato inviato alla tua casella. Tocca sotto per vedere la tua analisi ora.",
  "email.view_report": "Vedi il rapporto di analisi",
};

const dict: Record<Lang, Dict> = { en, fr, de, it };

type Ctx = {
  lang: Lang;
  setLang: (next: Lang) => void;
  t: (key: string) => string;
};

const I18nCtx = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Lang | null;
      if (saved && (LANGS as readonly { code: string }[]).find((l) => l.code === saved)) {
        setLangState(saved);
      }
    } catch {
      // ignore
    }
  }, []);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
  }, []);

  const t = useCallback(
    (key: string) => dict[lang]?.[key] ?? dict.en[key] ?? key,
    [lang]
  );

  const value = useMemo<Ctx>(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nCtx);
  if (!ctx) throw new Error("useI18n must be inside <I18nProvider>");
  return ctx;
}

export function useT() {
  return useI18n().t;
}
