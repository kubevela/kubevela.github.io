import React from 'react';
import MailchimpSubscribe from 'react-mailchimp-subscribe';

const Newsletter = () => {
  return (
    <div style={{ padding: '20px' }}>
      <MailchimpSubscribe url="https://kubevela.us17.list-manage.com/subscribe/post?u=27213eba6a4772c86d2332aeb&amp;id=f0873592ac&amp;f_id=002857e0f0" />
    </div>
  );
};

export default Newsletter;
