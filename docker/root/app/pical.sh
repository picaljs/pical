#!/bin/sh

exec s6-setuidgid pical node /app/lib/index.js
