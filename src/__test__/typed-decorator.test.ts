import 'reflect-metadata';
import { Injectable } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AopModule, Aspect, createDecorator, LazyDecorator, WrapParams } from '../index.js';

const TEXT = Symbol('typed-text');
const ASYNC_TEXT = Symbol('typed-async-text');
type TextMethod = (value: string) => string;
type AsyncTextMethod = (value: string) => Promise<string>;
type Options = { suffix: string };

@Aspect(TEXT)
class TextAspect implements LazyDecorator<TextMethod, Options> {
  wrap({ method, metadata }: WrapParams<TextMethod, Options>): TextMethod {
    return (value) => method(value) + metadata.suffix;
  }
}

@Aspect(ASYNC_TEXT)
class AsyncTextAspect implements LazyDecorator<AsyncTextMethod> {
  wrap({ method }: WrapParams<AsyncTextMethod>): AsyncTextMethod {
    return async (value) => (await method(value)).toUpperCase();
  }
}

@Injectable()
class TextService {
  private readonly prefix = 'hello ';

  @createDecorator<TextMethod>(TEXT, { suffix: '!' })
  text(value: string): string {
    return this.prefix + value;
  }

  @createDecorator<AsyncTextMethod>(ASYNC_TEXT)
  async asyncText(value: string): Promise<string> {
    return this.prefix + value;
  }
}

describe('createDecorator', () => {
  it('uses the existing aspect pipeline, forwards metadata, and preserves instance binding', async () => {
    const module = await Test.createTestingModule({
      imports: [AopModule],
      providers: [TextService, TextAspect, AsyncTextAspect],
    }).compile();
    try {
      await module.init();
      const service = module.get(TextService);
      expect(service.text('world')).toBe('hello world!');
      expect(service.text('again')).toBe('hello again!');
      await expect(service.asyncText('world')).resolves.toBe('HELLO WORLD');
    } finally {
      await module.close();
    }
  });

  it('calls the original method before AopModule initialization', () => {
    expect(new TextService().text('world')).toBe('hello world');
  });

  it('keeps untyped callable accessor behavior unchanged', () => {
    class CallableAccessor {
      @createDecorator(TEXT)
      get method(): TextMethod {
        return (value) => value;
      }
    }
    expect(new CallableAccessor().method('text')).toBe('text');
  });
});
