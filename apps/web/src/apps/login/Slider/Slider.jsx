import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";

// Import Swiper styles
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import "./swipperStyle.css";

import First from "./First";
import Second from "./Second";
import Third from "./Third";

// import required modules
import { Autoplay, Pagination } from "swiper/modules";

const Slider = () => {
  return (
    <>
      <Swiper
        spaceBetween={30}
        centeredSlides={true}
        autoplay={{
          delay: 2500,
          disableOnInteraction: false,
        }}
        pagination={{
          clickable: true,
        }}
        modules={[Autoplay, Pagination]}
        className="mySwiper"
      >
        <SwiperSlide className="bg-primary">
          <First />
        </SwiperSlide>
        <SwiperSlide className="bg-primary">
          <Second />
        </SwiperSlide>
        <SwiperSlide className="bg-primary">
          <Third />
        </SwiperSlide>
      </Swiper>
    </>
  );
};
export default Slider;
