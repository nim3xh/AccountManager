import React from 'react';

export default function AboutUs() {
  return (
    <div className="max-w-screen-lg mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-6">About Us</h1>
      <div className="flex flex-col lg:flex-row items-center gap-6">
        <img
          src="https://pnghq.com/wp-content/uploads/pnghq.com-trading-png.png"
          alt="About Us Image"
          className="w-full lg:w-1/2 rounded-lg "
        />
        <div>
          <p className="text-lg leading-relaxed text-gray-700 dark:text-gray-300">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse malesuada lacus ex, sit amet blandit leo lobortis eget. Nulla facilisi. Vivamus ut est id justo scelerisque condimentum. Nulla venenatis convallis eros, id interdum ligula bibendum nec. Mauris vehicula sem in ligula fermentum, et placerat lacus hendrerit.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-gray-700 dark:text-gray-300">
            Integer aliquet, nisl sit amet pulvinar vehicula, sapien enim tincidunt sapien, ac varius magna felis a magna. Aenean feugiat risus nec ligula tristique, at suscipit elit pretium. Curabitur at justo a nisl consectetur tempus non sit amet magna. Donec dapibus velit nec justo sollicitudin, at posuere libero pharetra.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-gray-700 dark:text-gray-300">
            Fusce fringilla cursus metus, et laoreet augue sodales ut. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vivamus consequat, felis nec aliquam malesuada, augue magna pharetra eros, vel sagittis urna eros sit amet tortor. Praesent fermentum felis at velit auctor, nec consequat risus fermentum.
          </p>
        </div>
      </div>
    </div>
  );
}
