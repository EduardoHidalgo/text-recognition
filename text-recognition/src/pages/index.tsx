import { YugiohCard } from "@/types/yugioh";
import { ChangeEvent } from "react";

type ApiResult =
  | {
      card: YugiohCard;
    }
  | { error: string };

export default function Home() {
  const onChangeImage = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;

    console.log({ files });

    if (files == null) return;

    const formData = new FormData();
    const file = files[0];
    formData.append("file", files[0]);

    const response = await fetch(
      `/api/hello?name=${encodeURIComponent(file.name)}`,
      {
        method: "POST",
        body: formData,
      }
    );

    const result = (await response.json()) as ApiResult;

    console.log({ result });
  };

  return (
    <main>
      <h1>hello world</h1>
      <input type="file" onChange={(e) => onChangeImage(e)} />
    </main>
  );
}
