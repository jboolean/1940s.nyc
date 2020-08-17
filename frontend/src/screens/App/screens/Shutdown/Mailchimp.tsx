import React from 'react';

import stylesheet from './mailchimp.less';

export default function Mailchimp(): JSX.Element {
  return (
    <div
      className={stylesheet.mailchimp}
      dangerouslySetInnerHTML={{
        __html: `
    <div id="mc_embed_signup">
      <form action="https://nyc.us17.list-manage.com/subscribe/post?u=0b815390af439deb5de37b43d&amp;id=8b75b0597a" method="post" id="mc-embedded-subscribe-form" name="mc-embedded-subscribe-form" class="validate" target="_blank" novalidate>
          <div id="mc_embed_signup_scroll">
        
      <div class="mc-field-group">
        <label for="mce-EMAIL">Email Address </label>
        <input type="email" value="" name="EMAIL" class="required email" id="mce-EMAIL" placeholder="Email address">
      </div>
        <div id="mce-responses" class="clear">
          <div class="response" id="mce-error-response" style="display:none"></div>
          <div class="response" id="mce-success-response" style="display:none"></div>
        </div>    <!-- real people should not fill this in and expect good things - do not remove this or risk form bot signups-->
          <div style="position: absolute; left: -5000px;" aria-hidden="true"><input type="text" name="b_0b815390af439deb5de37b43d_8b75b0597a" tabindex="-1" value=""></div>
          <div class="clear"><input type="submit" value="Submit" name="subscribe" id="mc-embedded-subscribe" class="button"></div>
          </div>
      </form>
      </div>
`,
      }}
    />
  );
}
