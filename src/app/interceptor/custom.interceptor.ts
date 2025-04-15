import { HttpInterceptorFn } from '@angular/common/http';

export const customInterceptor: HttpInterceptorFn = (req, next) => {
  debugger;
  const token = localStorage.getItem('auth_token');
  const clonedReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  })
  
  return next(clonedReq);
};
