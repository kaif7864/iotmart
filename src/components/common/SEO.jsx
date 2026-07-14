import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEO = ({ title, description, keywords }) => {
  return (
    <Helmet>
      <title>{title || 'IoTMart'}</title>
      <meta name="description" content={description || 'Next-Gen Electronic Components & IoT Hardware'} />
      {keywords && <meta name="keywords" content={keywords} />}
    </Helmet>
  );
};

export default SEO;
