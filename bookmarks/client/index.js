#!/usr/bin/env node

import { Command } from 'commander';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import os from 'os';

const program = new Command();
program.version('1.0.0').description('CLI for Bookmark Manager');

const API_URL = process.env.API_URL || 'http://localhost:3000';
const TOKEN_PATH = path.join(os.homedir(), '.bm-cli-token');

// Helper to get token
const getToken = () => {
  if (fs.existsSync(TOKEN_PATH)) {
    return fs.readFileSync(TOKEN_PATH, 'utf-8').trim();
  }
  return null;
};

// Helper for axios instance
const getApi = () => {
  const token = getToken();
  return axios.create({
    baseURL: API_URL,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
};

program
  .command('register <username> <password>')
  .description('Register a new user')
  .action(async (username, password) => {
    try {
      await axios.post(`${API_URL}/register`, { username, password });
      console.log('Registration successful! You can now login.');
    } catch (error) {
      console.error('Error registering:', error.response?.data?.error || error.message);
    }
  });

program
  .command('login <username> <password>')
  .description('Login to get access token')
  .action(async (username, password) => {
    try {
      const response = await axios.post(`${API_URL}/login`, { username, password });
      const token = response.data.token;
      fs.writeFileSync(TOKEN_PATH, token);
      console.log('Login successful! Token saved locally.');
    } catch (error) {
      console.error('Error logging in:', error.response?.data?.error || error.message);
    }
  });

program
  .command('logout')
  .description('Logout and clear local token')
  .action(() => {
    if (fs.existsSync(TOKEN_PATH)) {
      fs.unlinkSync(TOKEN_PATH);
      console.log('Logged out successfully.');
    } else {
      console.log('You are not logged in.');
    }
  });

program
  .command('add <url> [title] [description]')
  .description('Add a new bookmark')
  .action(async (url, title, description) => {
    try {
      const api = getApi();
      const response = await api.post('/bookmarks', { url, title, description });
      console.log('Bookmark added!', response.data);
    } catch (error) {
      console.error('Error adding bookmark:', error.response?.data?.error || error.message);
    }
  });

program
  .command('add-bulk <filepath>')
  .description('Add bookmarks from a JSON file')
  .action(async (filepath) => {
    try {
      const fileContent = fs.readFileSync(path.resolve(filepath), 'utf-8');
      const bookmarks = JSON.parse(fileContent);
      
      const api = getApi();
      const response = await api.post('/bookmarks', bookmarks);
      console.log('Bulk bookmarks added!', response.data);
    } catch (error) {
      console.error('Error adding bulk bookmarks:', error.response?.data?.error || error.message);
    }
  });

program
  .command('list')
  .description('List all bookmarks')
  .action(async () => {
    try {
      const api = getApi();
      const response = await api.get('/bookmarks');
      const bookmarks = response.data;
      if (bookmarks.length === 0) {
        console.log('No bookmarks found.');
      } else {
        bookmarks.forEach(bm => {
          console.log(`[${bm.id}] ${bm.url} ${bm.title ? '- ' + bm.title : ''}`);
        });
      }
    } catch (error) {
      console.error('Error fetching bookmarks:', error.response?.data?.error || error.message);
    }
  });

program
  .command('delete <id>')
  .description('Delete a bookmark by ID')
  .action(async (id) => {
    try {
      const api = getApi();
      await api.delete(`/bookmarks/${id}`);
      console.log(`Bookmark ${id} deleted.`);
    } catch (error) {
      console.error('Error deleting bookmark:', error.response?.data?.error || error.message);
    }
  });

program.parse(process.argv);
