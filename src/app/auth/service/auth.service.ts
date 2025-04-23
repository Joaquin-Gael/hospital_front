import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { User, UserResponse } from '../../pages/user-panel/models/user.model';

@Injectable({
    providedIn: 'root'
})

export class AuthService {
    private apiUrl = 'http://127.0.0.1:8000/auth/login';
    private userSubject = new BehaviorSubject<User | null>(null);
    user$ = this.userSubject.asObservable();
  
    constructor(private http: HttpClient) {}
    
    isLoggedIn(): boolean {
      return this.userSubject.value !== null;
    }

    login(loginObj: { email: string; password: string }): Observable<UserResponse> {
      return this.http.post<UserResponse>(this.apiUrl, loginObj);
    }
  
    setUser(UserResponse: UserResponse) {
      const user = UserResponse.user;
      this.userSubject.next(user);
      localStorage.setItem('user', JSON.stringify(user));
    }
  
    getUser(): User | null {
      return this.userSubject.value;
    }
  }

