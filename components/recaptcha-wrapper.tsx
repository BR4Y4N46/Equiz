"use client";
import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import ReCAPTCHALib from 'react-google-recaptcha';

const ReCAPTCHA = ReCAPTCHALib as any;

interface RecaptchaWrapperProps {
  sitekey: string;
  onChange: (token: string | null) => void;
  theme?: 'light' | 'dark';
}

export interface RecaptchaWrapperRef {
  reset: () => void;
}

const RecaptchaWrapper = forwardRef<RecaptchaWrapperRef, RecaptchaWrapperProps>(
  function RecaptchaWrapperInner(props, ref) {
    const recaptchaRef = useRef<any>(null);

    useImperativeHandle(ref, () => ({
      reset: () => {
        recaptchaRef?.current?.reset?.();
      },
    }));

    return (
      <ReCAPTCHA
        ref={recaptchaRef}
        sitekey={props?.sitekey ?? ''}
        onChange={props?.onChange}
        theme={props?.theme ?? 'dark'}
      />
    );
  }
);

export default RecaptchaWrapper;
