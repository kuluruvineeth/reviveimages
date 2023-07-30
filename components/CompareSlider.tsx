import {
  ReactCompareSlider,
  ReactCompareSliderImage,
} from "react-compare-slider";

export const CompareSlider = ({
  original,
  revived,
}: {
  original: string;
  revived: string;
}) => {
  return (
    <ReactCompareSlider
      itemOne={<ReactCompareSliderImage src={original} alt="original image" />}
      itemTwo={<ReactCompareSliderImage src={revived} alt="revived image" />}
      portrait
      className="flex w-[475px] mt-5"
    />
  );
};
