import vision from "@google-cloud/vision";

import { YugiohCard, YugiohDatabase } from "@/types/yugioh";

export interface FindCardArgs {
  database: YugiohDatabase;
  file: File;
  keyFile: string;
}

export async function findCard({
  database,
  file,
  keyFile,
}: FindCardArgs): Promise<
  | {
      card: YugiohCard;
    }
  | { error: string }
> {
  const client = new vision.ImageAnnotatorClient({
    keyFile,
  });

  let detection: string | null = null;
  const buffer = (await file.arrayBuffer()) as Buffer;
  const [result] = await client.textDetection(buffer);

  if (result.fullTextAnnotation && result.fullTextAnnotation.text)
    detection = result.fullTextAnnotation.text;

  if (detection == null) return { error: "failure in text detection" };

  const values = detection.split("\n");

  const name = values[0];

  const cardNumber = values.find((v) =>
    /[A-Z]{2,4}\d{0,4}-[A-Z]{2,4}\d{2,4}/gm.test(v)
  );

  console.log({ values, cardNumber });

  if (cardNumber) {
    const splitedCardNumber = cardNumber.split("-");
    const firstParfOfCardNumber = splitedCardNumber[0];

    let cardNumberReplaced = firstParfOfCardNumber.replace("0", "O");

    if (cardNumberReplaced.includes("ES"))
      cardNumberReplaced = cardNumberReplaced.replace("ES", "EN");

    if (cardNumberReplaced.includes("FR"))
      cardNumberReplaced = cardNumberReplaced.replace("FR", "EN");

    if (cardNumberReplaced.includes("JP"))
      cardNumberReplaced = cardNumberReplaced.replace("JP", "EN");

    const fixedCardNumber = cardNumberReplaced + "-" + splitedCardNumber[1];

    const searchs = { name, cardNumber, fixedCardNumber };

    const indexFound = database.data.findIndex((card) => {
      if (card.card_sets) {
        if (card.card_sets.some((cs) => cs.set_code === searchs.cardNumber)) {
          return true;
        }

        if (
          card.card_sets.some((cs) => cs.set_code === searchs.fixedCardNumber)
        ) {
          return true;
        }

        if (card.name.toUpperCase() == searchs.name.toUpperCase()) {
          return true;
        }
      }
      return false;
    });

    if (indexFound > 0) {
      const card = database.data[indexFound];

      return { card };
    } else {
      return { error: "Invalid card number, unable to find this card." };
    }
  } else {
    return { error: "failed to detect card number" };
  }
}
