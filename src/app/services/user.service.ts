import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { UserRead, UserCreate, UserUpdate, UserDelete } from './interfaces/user.interface';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly endpoints = {
    users: 'users',
    userById: (userId: string) => `users/${userId}`,
    add: 'users/add',
    delete: (userId: string) => `users/delete/${userId}`,
    update: (userId: string) => `users/update/${userId}`,
    ban: (userId: string) => `users/ban/${userId}`,
    unban: (userId: string) => `users/unban/${userId}`
  };

  constructor(private readonly apiService: ApiService) {}

  getUsers(): Observable<UserRead[]> {
    return this.apiService.get<UserRead[]>(this.endpoints.users).pipe(
      catchError(this.handleError('getUsers'))
    );
  }

  getUserById(userId: string): Observable<UserRead> {
    return this.apiService.get<UserRead>(this.endpoints.userById(userId)).pipe(
      catchError(this.handleError('getUserById'))
    );
  }

  createUser(user: UserCreate): Observable<UserRead> {
    return this.apiService.post<UserRead>(this.endpoints.add, user).pipe(
      catchError(this.handleError('createUser'))
    );
  }

  updateUser(userId: string, user: UserUpdate): Observable<UserRead> {
    return this.apiService.put<UserRead>(this.endpoints.update(userId), user).pipe(
      catchError(this.handleError('updateUser'))
    );
  }

  deleteUser(userId: string): Observable<UserDelete> {
    return this.apiService.delete<UserDelete>(this.endpoints.delete(userId)).pipe(
      catchError(this.handleError('deleteUser'))
    );
  }

  banUser(userId: string): Observable<UserRead> {
    return this.apiService.put<{ user: UserRead; message: string }>(this.endpoints.ban(userId), {}).pipe(
      map(response => response.user),
      catchError(this.handleError('banUser'))
    );
  }

  unbanUser(userId: string): Observable<UserRead> {
    return this.apiService.put<{ user: UserRead; message: string }>(this.endpoints.unban(userId), {}).pipe(
      map(response => response.user),
      catchError(this.handleError('unbanUser'))
    );
  }

  private handleError(operation: string) {
    return (error: any): Observable<never> => {
      const errorMessage = error.error?.detail || error.message || 'Unknown error';
      console.error(`${operation} failed: ${errorMessage}`);
      return throwError(() => new Error(`${operation} failed: ${errorMessage}`));
    };
  }
}